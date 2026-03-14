"use client";

import { useEffect, useRef } from "react";

import type { ChatMessage } from "@/lib/types";

type CopilotChatPanelProps = {
  eyebrow: string;
  title: string;
  helperText: string;
  mode: "gemini" | "fallback";
  modeActiveLabel: string;
  modeFallbackLabel: string;
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
  eyebrow,
  title,
  helperText,
  mode,
  modeActiveLabel,
  modeFallbackLabel,
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
    <div className="flex min-h-[32rem] max-h-[min(78vh,44rem)] flex-col overflow-hidden rounded-[28px] border border-line/80 bg-panel/95 shadow-frame">
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
            <span
              className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] ${
                mode === "gemini" ? "bg-safe/10 text-safe" : "bg-review/10 text-review"
              }`}
            >
              {mode === "gemini" ? modeActiveLabel : modeFallbackLabel}
            </span>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{helperText}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div ref={transcriptRef} className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-3 rounded-[22px] bg-white/35 p-2 dark:bg-slate-950/18">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[92%] rounded-[20px] px-4 py-3 text-sm leading-7 ${
                  message.role === "assistant"
                    ? "bg-panel text-ink dark:bg-slate-800/88 dark:text-slate-100"
                    : "ml-auto bg-ink text-paper dark:bg-slate-100 dark:text-slate-900"
                }`}
              >
                {message.content}
              </div>
            ))}
            {isPending ? (
              <div className="max-w-[92%] rounded-[20px] bg-panel px-4 py-3 text-sm text-muted dark:bg-slate-800/88 dark:text-slate-300">
                {pendingLabel}
              </div>
            ) : null}
          </div>
        </div>

        <div
          ref={footerRef}
          className="border-t border-line/60 bg-paper/88 px-6 pb-6 pt-4 dark:bg-slate-950/28"
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
                className="rounded-full border border-line/80 bg-paper/80 px-4 py-2 text-sm text-ink transition hover:bg-[#efe4d1] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900/55 dark:hover:bg-slate-800/75"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="mt-4 flex flex-col gap-3 rounded-[20px] border border-line/80 bg-paper/95 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:flex-row sm:items-center dark:bg-slate-950/36 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
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
              className="h-12 flex-1 rounded-[16px] border border-line/70 bg-white px-4 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-slate-400 focus:ring-2 focus:ring-slate-200/70 dark:border-slate-700/80 dark:bg-slate-950/72 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-800/80"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              className="inline-flex h-12 min-w-[9.75rem] items-center justify-center rounded-[14px] bg-[#0B1324] px-4 text-sm font-medium text-paper shadow-[0_10px_20px_rgba(11,19,36,0.12)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#111C33] hover:shadow-[0_14px_24px_rgba(11,19,36,0.16)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none disabled:opacity-55 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Send question
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
