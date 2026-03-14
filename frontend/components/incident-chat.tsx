"use client";

import { startTransition, useState } from "react";

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        decision === "block" || decision === "hold"
          ? "I can explain why this incident was escalated, which score drove the decision, and what an analyst should verify next."
          : "I can break down the queue decision, risk drivers, and next investigative steps.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [suggestions, setSuggestions] = useState(INITIAL_PROMPTS);
  const [mode, setMode] = useState<"openai" | "fallback">("fallback");

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
    <div className="rounded-[28px] border border-line/80 bg-panel/95 p-6 shadow-frame">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted">
            Analyst copilot
          </p>
          <h2 className="mt-2 font-serif text-2xl text-ink">
            Ask about this incident
          </h2>
        </div>
        <span className="rounded-full border border-line bg-paper px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted">
          grounded in queue evidence
        </span>
      </div>
      <div className="mb-4 flex justify-end">
        <span
          className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
            mode === "openai" ? "bg-safe/10 text-safe" : "bg-review/10 text-review"
          }`}
        >
          {mode === "openai" ? "Live OpenAI" : "Fallback mode"}
        </span>
      </div>

      <div className="space-y-4">
        <div className="max-h-[360px] space-y-3 overflow-y-auto rounded-[24px] border border-line/70 bg-paper/70 p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[92%] rounded-[20px] px-4 py-3 text-sm leading-7 ${
                message.role === "assistant"
                  ? "bg-panel text-ink"
                  : "ml-auto bg-ink text-paper"
              }`}
            >
              {message.content}
            </div>
          ))}
          {isPending ? (
            <div className="max-w-[92%] rounded-[20px] bg-panel px-4 py-3 text-sm text-muted">
              OpenAI is drafting a grounded answer...
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              disabled={isPending}
              className="rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink transition hover:bg-[#efe4d1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          className="flex flex-col gap-3 lg:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask what drove the escalation, which signals are strongest, or what to verify next."
            rows={3}
            className="min-h-[96px] flex-1 rounded-[22px] border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-ink"
          />
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="rounded-[22px] bg-ink px-6 py-3 text-sm text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send question
          </button>
        </form>
      </div>
    </div>
  );
}
