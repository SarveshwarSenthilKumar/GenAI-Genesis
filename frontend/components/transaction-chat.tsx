"use client";

import { startTransition, useState } from "react";

import { CopilotChatPanel } from "@/components/copilot-chat-panel";
import { postTransactionChat } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

type TransactionChatProps = {
  transactionId: string;
  decision: "approve" | "review" | "block";
};

const INITIAL_PROMPTS = [
  "Why did Sentinel make this decision?",
  "What behavior signals stand out most?",
  "Explain the recipient network risk.",
];

export function TransactionChat({
  transactionId,
  decision,
}: TransactionChatProps) {
  const helperText =
    decision === "block"
      ? "I can explain why this transfer was blocked, how the behavior differed from baseline, and how the recipient links into the suspicious network."
      : "I can break down the decision, behavior signals, and graph exposure for this transfer.";
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
        const response = await postTransactionChat(transactionId, {
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
              "The transaction chat is temporarily unavailable. The case detail panel still contains the deterministic risk evidence and recommended action.",
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
      title="Ask about this transaction"
      helperText={helperText}
      evidenceLabel="grounded in Sentinel signals"
      messages={messages}
      suggestions={suggestions}
      input={input}
      isPending={isPending}
      pendingLabel="Gemini is drafting a grounded answer..."
      placeholder="Ask why the transfer was flagged, what the graph means, or which signals mattered most."
      onInputChange={setInput}
      onSuggestionClick={sendMessage}
      onSubmit={() => sendMessage(input)}
    />
  );
}
