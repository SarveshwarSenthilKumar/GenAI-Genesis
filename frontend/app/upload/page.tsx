"use client";

import { useState } from "react";

import { postUploadLive } from "@/lib/api";
import type { LiveMonitorPayload } from "@/lib/types";

import { LiveMonitorDashboard } from "@/components/live-monitor-dashboard";

export default function UploadPage() {
  const [transactionsFile, setTransactionsFile] = useState<File | null>(null);
  const [accountsFile, setAccountsFile] = useState<File | null>(null);
  const [payload, setPayload] = useState<LiveMonitorPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPayload(null);

    if (!transactionsFile) {
      setError("Upload a transactions file to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await postUploadLive(transactionsFile, accountsFile ?? undefined);
      setPayload(response);
    } catch {
      setError("Could not process the upload. Check the file format and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="space-y-8">
      <section className="rounded-[28px] border border-line/70 bg-panel/95 p-6 shadow-frame">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Data ingestion
            </p>
            <h1 className="mt-2 font-serif text-3xl text-ink">
              Upload transaction data
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              We will sample the first 50 rows to infer the schema, then generate a
              risk report that mirrors the live monitor experience.
            </p>
          </div>
          <span className="rounded-full border border-line bg-paper px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted">
            CSV upload
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="rounded-[20px] border border-line/60 bg-paper/70 px-4 py-4 text-sm text-ink">
            <span className="block text-xs uppercase tracking-[0.18em] text-muted">
              Transactions file (CSV)
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setTransactionsFile(event.target.files?.[0] ?? null)}
              className="mt-3 block w-full text-sm"
            />
          </label>
          <label className="rounded-[20px] border border-line/60 bg-paper/70 px-4 py-4 text-sm text-ink">
            <span className="block text-xs uppercase tracking-[0.18em] text-muted">
              Accounts file (optional CSV)
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setAccountsFile(event.target.files?.[0] ?? null)}
              className="mt-3 block w-full text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[20px] bg-ink px-6 py-3 text-sm text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Analyzing dataset..." : "Generate report"}
          </button>
        </form>

        {error ? (
          <div className="mt-4 rounded-[20px] border border-block/40 bg-block/10 px-4 py-3 text-sm text-ink">
            {error}
          </div>
        ) : null}
      </section>

      {payload ? (
        <LiveMonitorDashboard initialData={payload} enableStreaming={false} />
      ) : null}
    </main>
  );
}
