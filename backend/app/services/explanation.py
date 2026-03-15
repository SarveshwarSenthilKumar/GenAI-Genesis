from __future__ import annotations

import json
import time
from typing import Any
from urllib import error

from openai import BadRequestError, OpenAI

from ..config import OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
from ..models import ExplanationResponse, TransactionChatResponse


class ExplanationService:
    def __init__(self) -> None:
        self._cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self._cache_ttl_seconds = 600.0
        self._client = (
            OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)
            if OPENAI_API_KEY
            else None
        )

    @staticmethod
    def _extract_json_object(text: str) -> dict[str, Any]:
        cleaned = text.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise json.JSONDecodeError("No JSON object found.", cleaned, 0)

    def _get_cache(self, key: str) -> dict[str, Any] | None:
        cached = self._cache.get(key)
        if not cached:
            return None
        expires_at, value = cached
        if expires_at < time.time():
            self._cache.pop(key, None)
            return None
        return value

    def _set_cache(self, key: str, value: dict[str, Any]) -> None:
        self._cache[key] = (time.time() + self._cache_ttl_seconds, value)

    @staticmethod
    def _normalized_text(text: str) -> str:
        return " ".join(text.lower().strip().split())

    def _is_prompt_injection(self, message: str) -> bool:
        normalized = self._normalized_text(message)
        blocked_patterns = (
            "ignore previous",
            "ignore all previous",
            "system prompt",
            "reveal your prompt",
            "developer message",
            "act as",
            "pretend to be",
            "jailbreak",
            "bypass your rules",
            "disregard instructions",
        )
        return any(pattern in normalized for pattern in blocked_patterns)

    def _rewrite_question(
        self, message: str, history: list[dict[str, str]]
    ) -> tuple[str, str]:
        normalized = self._normalized_text(message)
        if not normalized:
            return (
                "summarize_case",
                "Explain what is happening in this incident, why it was escalated, and what the strongest risk drivers are.",
            )

        incomplete_prompts = {
            "can you",
            "could you",
            "would you",
            "please",
            "explain what",
            "can you explain",
            "tell me",
            "show me",
        }
        if normalized in incomplete_prompts:
            return (
                "clarify_incomplete",
                "The user's prompt is incomplete. Ask one short clarification question instead of summarizing the case.",
            )

        if normalized in {"why", "why?", "what happened", "what happened?", "explain", "explain?"}:
            return (
                "why_follow_up",
                "Explain why this incident was escalated, using the most recent assistant answer as context. Clarify the main signals and decision path.",
            )

        if normalized in {"follow up", "follow-up", "can you follow up?", "can you follow up"}:
            return (
                "follow_up",
                "Continue the previous explanation with the next most useful analyst detail, staying grounded in the incident context and prior assistant answer.",
            )

        if normalized.startswith("can you explain what"):
            return (
                "explain_case",
                "Explain what is going on in this case, what looks suspicious, and why Sentinel flagged it. Treat the user's wording as a request for a fuller incident explanation.",
            )

        if normalized.startswith("can you explain") or normalized.startswith("explain"):
            return (
                "explain_case",
                "Explain what is going on in this case, what looks suspicious, and why Sentinel flagged it. Answer naturally and directly.",
            )

        if normalized.startswith("what is wrong") or normalized.startswith("what's wrong"):
            return (
                "what_is_wrong",
                "Explain what is wrong with this case, focusing on the specific suspicious behavior, network pattern, and why those signals matter.",
            )

        if normalized.startswith("what should") and "verify" in normalized:
            return (
                "verify_next",
                "Explain what the analyst should verify next and why those checks matter for this incident.",
            )

        if normalized.startswith("which score") or "contributed the most" in normalized:
            return (
                "top_driver",
                "Explain which score or signal family contributed the most and why it carried the most weight in this incident.",
            )

        prior_assistant = next(
            (
                item.get("content", "").strip()
                for item in reversed(history)
                if item.get("role") == "assistant" and item.get("content", "").strip()
            ),
            "",
        )
        if len(normalized) <= 24 and prior_assistant:
            return (
                "short_follow_up",
                f"The user sent a short follow-up: {message!r}. Interpret it in relation to the previous assistant answer and continue the explanation directly.",
            )

        return ("custom_question", message.strip())

    def generate(
        self,
        payload: dict[str, Any],
        fallback_explanation: str,
        fallback_bullets: list[str],
        fallback_action: str,
    ) -> ExplanationResponse:
        if not self._client:
            return ExplanationResponse(
                explanation=fallback_explanation,
                bullets=fallback_bullets[:2],
                action=fallback_action,
                mode="fallback",
            )

        cache_key = f"explanation:{json.dumps(payload, sort_keys=True)}"
        cached = self._get_cache(cache_key)
        if cached:
            return ExplanationResponse(**cached)

        system_prompt = (
            "You are a bank fraud analyst copilot. "
            "Return JSON only with keys explanation, bullets, action. "
            "Rules: explanation max 50 words, max 2 bullets, do not invent facts, "
            "and keep the action aligned with the provided decision. "
            "Do not add any prose before or after the JSON."
        )
        user_prompt = f"Input:\n{json.dumps(payload, indent=2)}"
        try:
            response = self._client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=320,
            )
            candidate_text = response.choices[0].message.content or ""
            parsed = self._extract_json_object(candidate_text)
            explanation = str(parsed.get("explanation", "")).strip()[:280]
            bullets = [str(item).strip() for item in parsed.get("bullets", []) if str(item).strip()]
            action = str(parsed.get("action", fallback_action)).strip()
            if not explanation:
                raise ValueError("OpenAI response missing explanation.")
            result = ExplanationResponse(
                explanation=explanation,
                bullets=bullets[:2] or fallback_bullets[:2],
                action=action or fallback_action,
                mode="openai",
            )
            self._set_cache(cache_key, result.model_dump())
            return result
        except (
            error.URLError,
            TimeoutError,
            ValueError,
            KeyError,
            json.JSONDecodeError,
            IndexError,
            BadRequestError,
        ):
            return ExplanationResponse(
                explanation=fallback_explanation,
                bullets=fallback_bullets[:2],
                action=fallback_action,
                mode="fallback",
            )

    def chat(
        self,
        transaction_context: dict[str, Any],
        message: str,
        history: list[dict[str, str]],
        fallback_answer: str,
        fallback_follow_ups: list[str],
    ) -> TransactionChatResponse:
        # Latch guard is temporarily disabled so we can test the larger token
        # budget on the raw model behavior.
        #
        # if self._is_prompt_injection(message):
        #     return TransactionChatResponse(
        #         answer=(
        #             "I can help with this incident only. Ask about the risk drivers, decision, "
        #             "network evidence, or what the analyst should verify next."
        #         ),
        #         follow_ups=fallback_follow_ups[:2],
        #         mode="fallback",
        #     )

        if not self._client:
            return TransactionChatResponse(
                answer=fallback_answer,
                follow_ups=fallback_follow_ups[:2],
                mode="fallback",
            )

        cache_key = f"chat:{json.dumps({'context': transaction_context, 'message': message, 'history': history[-6:]}, sort_keys=True)}"
        cached = self._get_cache(cache_key)
        if cached:
            return TransactionChatResponse(**cached)

        trimmed_history = history[-6:]
        # Latch rewriting is temporarily disabled so we can test the larger
        # token budget on the raw user prompt.
        #
        # intent, effective_question = self._rewrite_question(message, trimmed_history)
        prior_user = next(
            (
                item.get("content", "").strip()
                for item in reversed(trimmed_history)
                if item.get("role") == "user" and item.get("content", "").strip()
            ),
            "",
        )
        prior_assistant = next(
            (
                item.get("content", "").strip()
                for item in reversed(trimmed_history)
                if item.get("role") == "assistant" and item.get("content", "").strip()
            ),
            "",
        )
        intent = "raw_prompt"
        effective_question = message
        system_prompt = (
            "You are Sentinel Chat, a banking fraud analyst assistant. "
            "Answer only from the provided transaction context and conversation history. "
            "Do not invent signals, policies, or data. "
            "Answer the user's exact question first, then briefly add context if helpful. "
            "Keep the answer under 120 words. "
            "Return JSON only with keys answer and follow_ups. "
            "follow_ups must contain at most 2 short suggested questions."
        )
        user_prompt = (
            f"Transaction context:\n{json.dumps(transaction_context, indent=2)}\n\n"
            f"Conversation history:\n{json.dumps(trimmed_history, indent=2)}\n\n"
            f"Detected intent:\n{intent}\n\n"
            f"Previous user turn:\n{prior_user or 'None'}\n\n"
            f"Previous assistant turn:\n{prior_assistant or 'None'}\n\n"
            f"Original user question:\n{message}\n\n"
            f"Question to answer:\n{effective_question}"
        )
        try:
            response = self._client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=500,
            )
            candidate_text = response.choices[0].message.content or ""
            parsed = self._extract_json_object(candidate_text)
            answer = str(parsed.get("answer", "")).strip()
            follow_ups = [
                str(item).strip()
                for item in parsed.get("follow_ups", [])
                if str(item).strip()
            ]
            if not answer:
                raise ValueError("OpenAI response missing answer.")
            result = TransactionChatResponse(
                answer=answer[:800],
                follow_ups=follow_ups[:2] or fallback_follow_ups[:2],
                mode="openai",
            )
            self._set_cache(cache_key, result.model_dump())
            return result
        except (
            error.URLError,
            TimeoutError,
            ValueError,
            KeyError,
            json.JSONDecodeError,
            IndexError,
            Exception,
        ):
            return TransactionChatResponse(
                answer=fallback_answer,
                follow_ups=fallback_follow_ups[:2],
                mode="fallback",
            )
