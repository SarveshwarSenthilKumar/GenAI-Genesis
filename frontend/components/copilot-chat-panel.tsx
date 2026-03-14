"use client";

import { useEffect, useRef } from "react";

import type { ChatMessage } from "@/lib/types";

type CopilotChatPanelProps = {
  panelId?: string;
  eyebrow: string;
  title: string;
  helperText: string;
  evidenceLabel: string;
  messages: ChatMessage[];
  suggestions: string[];
  input: string;
  isPending: boolean;
  pendingLabel: string;
  placeholder: string;
  onInputChange: (value: string) => void;
  onSuggestionClick: (prompt: string) => void;
  onSubmit: () => void | Promise<void>;
};

export function CopilotChatPanel({
  panelId,
  eyebrow,
  title,
  helperText,
  evidenceLabel,
  messages,
  suggestions,
  input,
  isPending,
  pendingLabel,
  placeholder,
  onInputChange,
  onSuggestionClick,
  onSubmit,
}: CopilotChatPanelProps) {
  const footerRef = useRef<HTMLDivElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  function ensureComposerInView() {
    const footer = footerRef.current;
    if (!footer) {
      return;
    }

    const rect = footer.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    const targetTop = Math.max(absoluteTop - window.innerHeight + rect.height + 32, 0);

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const container = transcriptRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: isPending ? "auto" : "smooth",
    });
  }, [isPending, messages]);

  return (
    <div
      id={panelId}
      className="flex min-h-[32rem] max-h-[min(78vh,44rem)] scroll-mt-6 flex-col overflow-hidden rounded-[28px] border border-line/80 bg-panel/95 shadow-frame"
    >
      <div className="border-b border-line/60 px-6 pb-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">{eyebrow}</p>
            <h2 className="mt-2 font-serif text-2xl text-ink">{title}</h2>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <span className="rounded-full border border-line bg-paper px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted dark:bg-slate-950/36">
              {evidenceLabel}
            </span>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{helperText}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={transcriptRef} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[70%] rounded-[18px] px-4 py-3 text-sm leading-7 ${
                  message.role === "assistant"
                    ? "bg-panel/96 text-ink dark:bg-slate-800/88 dark:text-slate-100"
                    : "ml-auto bg-[#E8EDF3] text-ink dark:bg-slate-200 dark:text-slate-900"
                }`}
              >
                {message.content}
              </div>
            ))}
            {isPending ? (
              <div className="max-w-[70%] rounded-[18px] bg-panel/96 px-4 py-3 text-sm text-muted dark:bg-slate-800/88 dark:text-slate-300">
                {pendingLabel}
              </div>
            ) : null}
          </div>
        </div>

        <div
          ref={footerRef}
          className="border-t border-line/60 bg-transparent px-6 pb-6 pt-4"
        >
          <div className="flex flex-wrap gap-2">
            {suggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  ensureComposerInView();
                  onSuggestionClick(prompt);
                }}
                disabled={isPending}
                className="rounded-full border border-line/80 bg-transparent px-4 py-2 text-sm text-ink transition hover:bg-paper/70 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-900/55"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="mt-4 flex flex-col gap-3 rounded-[18px] border border-line/80 bg-transparent p-2 sm:flex-row sm:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              ensureComposerInView();
              void onSubmit();
            }}
          >
            <input
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onFocus={ensureComposerInView}
              placeholder={placeholder}
              className="h-12 flex-1 rounded-[16px] border border-line/70 bg-white px-4 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-slate-400 focus:ring-2 focus:ring-slate-200/70 dark:border-slate-300/70 dark:bg-slate-100 dark:text-slate-900 dark:placeholder:text-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-200/70"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="inline-flex h-10 min-w-[8.5rem] items-center justify-center rounded-[10px] bg-[#0B1324] px-4 text-sm font-medium text-paper shadow-[0_8px_16px_rgba(11,19,36,0.12)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#111C33] hover:shadow-[0_12px_20px_rgba(11,19,36,0.16)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none disabled:opacity-55 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Send question
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
