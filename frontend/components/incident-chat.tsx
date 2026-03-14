"use client";

import { startTransition, useState } from "react";

import { CopilotChatPanel } from "@/components/copilot-chat-panel";
import { postIncidentChat } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

type IncidentChatProps = {
  incidentId: string;
  decision: "allow" | "review" | "hold" | "block";
};

const INITIAL_PROMPTS = [
  "Why was this incident escalated?",
  "Which score mattered most?",
  "What should the analyst verify next?",
];

export function IncidentChat({ incidentId, decision }: IncidentChatProps) {
  const helperText =
    decision === "block" || decision === "hold"
      ? "I can explain why this incident was escalated, which score drove the decision, and what an analyst should verify next."
      : "I can break down the queue decision, risk drivers, and next investigative steps.";
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: helperText,
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [suggestions, setSuggestions] = useState(INITIAL_PROMPTS);
  const [mode, setMode] = useState<"gemini" | "fallback">("fallback");

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isPending) {
      return;
    }

    const nextUserMessage: ChatMessage = { role: "user", content: trimmed };
    const history = messages;

    setMessages((current) => [...current, nextUserMessage]);
    setInput("");
    setIsPending(true);

    startTransition(async () => {
      try {
        const response = await postIncidentChat(incidentId, {
          message: trimmed,
          history,
        });
        setMessages((current) => [
          ...current,
          { role: "assistant", content: response.answer },
        ]);
        setSuggestions(response.follow_ups.length ? response.follow_ups : INITIAL_PROMPTS);
        setMode(response.mode);
      } catch {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content:
              "Incident chat is temporarily unavailable. The investigation page still shows the score breakdown, recommended action, and network exposure.",
          },
        ]);
      } finally {
        setIsPending(false);
      }
    });
  }

  return (
    <CopilotChatPanel
      panelId="sentinel-assist"
      eyebrow="Sentinel Assist"
      title="Ask about this incident"
      helperText={helperText}
      evidenceLabel="grounded in queue evidence"
      messages={messages}
      suggestions={suggestions}
      input={input}
      isPending={isPending}
      pendingLabel="Gemini is drafting a grounded answer..."
      placeholder="Ask what drove the escalation, which signals are strongest, or what to verify next."
      onInputChange={setInput}
      onSuggestionClick={sendMessage}
      onSubmit={() => sendMessage(input)}
    />
  );
}
