"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import type { ChatMessage } from "@/lib/types";

type CopilotChatPanelProps = {
  panelId?: string;
  eyebrow: string;
  title: string;
  helperText: string;
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
      className="flex min-h-[42rem] max-h-[min(88vh,60rem)] scroll-mt-6 flex-col rounded-[30px] border border-line/65 bg-panel/92 shadow-frame"
    >
      <div className="px-7 pb-6 pt-7 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[18px] shadow-[0_14px_28px_rgba(11,19,36,0.16)]">
              <Image
                src="/sentinel-chat-icon.svg"
                alt="Sentinel chat icon"
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">{eyebrow}</p>
              <h2 className="mt-1 font-serif text-[2rem] leading-none text-ink sm:text-[2.25rem]">
                {title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                {helperText}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-line/70 bg-paper/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted dark:bg-slate-900/65 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-safe" />
            Live conversation
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-7 pb-7 sm:px-8">
        <div
          ref={transcriptRef}
          className="min-h-[24rem] flex-1 overflow-y-auto rounded-[28px] border border-line/60 bg-paper/52 px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] dark:border-slate-700/80 dark:bg-[#0e1a2d] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          <div className="space-y-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div className="max-w-[92%] space-y-2 sm:max-w-[86%]">
                  <div
                    className={`rounded-[24px] px-5 py-4 text-[1rem] leading-8 ${
                      message.role === "assistant"
                        ? "bg-white text-ink shadow-[0_10px_26px_rgba(15,23,42,0.08)] dark:bg-[#18263b] dark:text-slate-100"
                        : "bg-[#DCE6F2] text-ink shadow-[0_10px_24px_rgba(15,23,42,0.07)] dark:bg-[#24324a] dark:text-slate-100"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {isPending ? (
              <div className="flex justify-start">
                <div className="max-w-[92%] sm:max-w-[86%]">
                  <div className="rounded-[24px] bg-white px-5 py-4 text-[1rem] leading-8 text-muted shadow-[0_10px_26px_rgba(15,23,42,0.08)] dark:bg-[#18263b] dark:text-slate-300">
                    {pendingLabel}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div ref={footerRef} className="pt-5">
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
                className="rounded-full border border-line/70 bg-paper/72 px-4 py-2.5 text-sm text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#162236] dark:text-slate-100 dark:hover:bg-[#1d2b42]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              ensureComposerInView();
              void onSubmit();
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <textarea
                value={input}
                onChange={(event) => onInputChange(event.target.value)}
                onFocus={ensureComposerInView}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    ensureComposerInView();
                    void onSubmit();
                  }
                }}
                rows={1}
                placeholder={placeholder}
                className="h-14 flex-1 resize-none rounded-[18px] border border-line/70 bg-white px-5 py-4 text-[1rem] leading-6 text-ink outline-none transition placeholder:text-muted focus:border-slate-400 focus:ring-2 focus:ring-slate-200/70 dark:border-slate-700 dark:bg-[#162236] dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-slate-700/60"
              />
              <button
                type="submit"
                disabled={isPending || !input.trim()}
                className="inline-flex h-14 min-w-[9rem] items-center justify-center rounded-[18px] bg-[#0B1324] px-6 text-base font-medium text-paper shadow-[0_12px_24px_rgba(11,19,36,0.14)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#111C33] hover:shadow-[0_16px_28px_rgba(11,19,36,0.18)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none disabled:opacity-55 dark:bg-[#0B1324] dark:text-slate-100 dark:hover:bg-[#111C33]"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
