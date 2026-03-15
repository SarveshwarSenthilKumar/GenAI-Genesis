"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { postUploadDashboard, postUploadLive } from "@/lib/api";
import type { LiveMonitorPayload } from "@/lib/types";

import { LiveMonitorDashboard } from "@/components/live-monitor-dashboard";

export default function UploadPage() {
  const router = useRouter();
  const [transactionsFile, setTransactionsFile] = useState<File | null>(null);
  const [accountsFile, setAccountsFile] = useState<File | null>(null);
  const [payload, setPayload] = useState<LiveMonitorPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isAddingToDashboard, setIsAddingToDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  async function loadSampleFile(path: string, filename: string) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Could not load ${filename}`);
    }

    const blob = await response.blob();
    return new File([blob], filename, { type: "text/csv" });
  }

  async function handleLoadSample(
    target: "transactions" | "accounts" | "both",
  ) {
    setError(null);
    setDashboardError(null);
    setPayload(null);
    setIsLoadingSample(true);

    try {
      if (target === "transactions" || target === "both") {
        setTransactionsFile(
          await loadSampleFile(
            "/samples/upload-transactions-sample.csv",
            "upload-transactions-sample.csv",
          ),
        );
      }

      if (target === "accounts" || target === "both") {
        setAccountsFile(
          await loadSampleFile(
            "/samples/upload-accounts-sample.csv",
            "upload-accounts-sample.csv",
          ),
        );
      }
    } catch {
      setError("Could not load the sample CSVs right now.");
    } finally {
      setIsLoadingSample(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDashboardError(null);
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

  async function handleAddToDashboard() {
    if (!transactionsFile) {
      setDashboardError("Upload or load a transactions file before sending it to the dashboard.");
      return;
    }

    setDashboardError(null);
    setIsAddingToDashboard(true);

    try {
      await postUploadDashboard(transactionsFile, accountsFile ?? undefined);
      router.push("/dashboard");
    } catch {
      setDashboardError("Could not add this dataset to the dashboard right now.");
    } finally {
      setIsAddingToDashboard(false);
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
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
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
            <span className="mt-2 block text-xs leading-5 text-muted">
              Try the included sample ledger or upload your own file with transaction,
              sender, receiver, amount, and timestamp columns.
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => {
                setTransactionsFile(event.target.files?.[0] ?? null);
                setPayload(null);
                setError(null);
                setDashboardError(null);
              }}
              className="mt-3 block w-full text-sm"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
              <button
                type="button"
                onClick={() => handleLoadSample("transactions")}
                disabled={isLoadingSample}
                className="rounded-full border border-line bg-panel px-3 py-1.5 uppercase tracking-[0.16em] text-ink transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
              >
                Use sample
              </button>
              <Link
                href="/samples/upload-transactions-sample.csv"
                download
                className="uppercase tracking-[0.16em] text-muted transition hover:text-ink"
              >
                Download CSV
              </Link>
              <span>
                Selected: {transactionsFile?.name ?? "None"}
              </span>
            </div>
          </label>
          <label className="rounded-[20px] border border-line/60 bg-paper/70 px-4 py-4 text-sm text-ink">
            <span className="block text-xs uppercase tracking-[0.18em] text-muted">
              Accounts file (optional CSV)
            </span>
            <span className="mt-2 block text-xs leading-5 text-muted">
              Optional reference data for account metadata such as type, country, and
              risk tier.
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => {
                setAccountsFile(event.target.files?.[0] ?? null);
                setPayload(null);
                setError(null);
                setDashboardError(null);
              }}
              className="mt-3 block w-full text-sm"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
              <button
                type="button"
                onClick={() => handleLoadSample("accounts")}
                disabled={isLoadingSample}
                className="rounded-full border border-line bg-panel px-3 py-1.5 uppercase tracking-[0.16em] text-ink transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
              >
                Use sample
              </button>
              <Link
                href="/samples/upload-accounts-sample.csv"
                download
                className="uppercase tracking-[0.16em] text-muted transition hover:text-ink"
              >
                Download CSV
              </Link>
              <span>
                Selected: {accountsFile?.name ?? "None"}
              </span>
            </div>
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
        <section className="space-y-4">
          <div className="rounded-[24px] border border-line/70 bg-panel/95 p-5 shadow-frame">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">
                  Next step
                </p>
                <h2 className="mt-2 font-serif text-2xl text-ink">
                  Move this uploaded fraud snapshot into the dashboard
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Add the flagged results from this dataset to Sentinel&apos;s
                  investigation queue so you can review them in the main dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddToDashboard}
                disabled={isAddingToDashboard || isSubmitting}
                className="rounded-full bg-ink px-5 py-3 text-sm text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingToDashboard
                  ? "Adding to dashboard..."
                  : "Add flagged alerts to dashboard"}
              </button>
            </div>
            {dashboardError ? (
              <div className="mt-4 rounded-[18px] border border-block/40 bg-block/10 px-4 py-3 text-sm text-ink">
                {dashboardError}
              </div>
            ) : null}
          </div>
          <LiveMonitorDashboard initialData={payload} enableStreaming={false} />
        </section>
      ) : null}
    </main>
  );
}
