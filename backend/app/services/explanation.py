from __future__ import annotations

import json
import time
from typing import Any
from urllib import error, request

from ..config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_TIMEOUT_SECONDS
from ..models import ExplanationResponse, TransactionChatResponse


class ExplanationService:
    def __init__(self) -> None:
        self._cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self._cache_ttl_seconds = 600.0

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

    def generate(
        self,
        payload: dict[str, Any],
        fallback_explanation: str,
        fallback_bullets: list[str],
        fallback_action: str,
    ) -> ExplanationResponse:
        if not GEMINI_API_KEY:
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

        prompt = (
            "You are a bank fraud analyst copilot. "
            "Return JSON only with keys explanation, bullets, action. "
            "Rules: explanation max 50 words, max 2 bullets, do not invent facts, "
            "and keep the action aligned with the provided decision. "
            "Do not add any prose before or after the JSON.\n\n"
            f"Input:\n{json.dumps(payload, indent=2)}"
        )

        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 320,
                "responseMimeType": "application/json",
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        )

        req = request.Request(
            endpoint,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )

        try:
            with request.urlopen(req, timeout=GEMINI_TIMEOUT_SECONDS) as response:
                raw = json.loads(response.read().decode("utf-8"))
            candidate_text = (
                raw["candidates"][0]["content"]["parts"][0]["text"]
                if raw.get("candidates")
                else ""
            )
            parsed = self._extract_json_object(candidate_text)
            explanation = str(parsed.get("explanation", "")).strip()[:280]
            bullets = [str(item).strip() for item in parsed.get("bullets", []) if str(item).strip()]
            action = str(parsed.get("action", fallback_action)).strip()
            if not explanation:
                raise ValueError("Gemini response missing explanation.")
            result = ExplanationResponse(
                explanation=explanation,
                bullets=bullets[:2] or fallback_bullets[:2],
                action=action or fallback_action,
                mode="gemini",
            )
            self._set_cache(cache_key, result.model_dump())
            return result
        except (error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
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
        if not GEMINI_API_KEY:
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
        prompt = (
            "You are Sentinel Chat, a banking fraud analyst assistant. "
            "Answer only from the provided transaction context and conversation history. "
            "Do not invent signals, policies, or data. "
            "Keep the answer under 120 words. "
            "Return JSON only with keys answer and follow_ups. "
            "follow_ups must contain at most 2 short suggested questions.\n\n"
            f"Transaction context:\n{json.dumps(transaction_context, indent=2)}\n\n"
            f"Conversation history:\n{json.dumps(trimmed_history, indent=2)}\n\n"
            f"User question:\n{message}"
        )

        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 220,
                "responseMimeType": "application/json",
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        )

        req = request.Request(
            endpoint,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )

        try:
            with request.urlopen(req, timeout=GEMINI_TIMEOUT_SECONDS) as response:
                raw = json.loads(response.read().decode("utf-8"))
            candidate_text = (
                raw["candidates"][0]["content"]["parts"][0]["text"]
                if raw.get("candidates")
                else ""
            )
            parsed = self._extract_json_object(candidate_text)
            answer = str(parsed.get("answer", "")).strip()
            follow_ups = [
                str(item).strip()
                for item in parsed.get("follow_ups", [])
                if str(item).strip()
            ]
            if not answer:
                raise ValueError("Gemini response missing answer.")
            result = TransactionChatResponse(
                answer=answer[:800],
                follow_ups=follow_ups[:2] or fallback_follow_ups[:2],
                mode="gemini",
            )
            self._set_cache(cache_key, result.model_dump())
            return result
        except (error.URLError, TimeoutError, ValueError, KeyError, json.JSONDecodeError):
            return TransactionChatResponse(
                answer=fallback_answer,
                follow_ups=fallback_follow_ups[:2],
                mode="fallback",
            )
