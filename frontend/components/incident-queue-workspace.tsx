"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { getIncidentPanel, refreshIncidentQueue } from "@/lib/api";
import type {
  IncidentPanelResponse,
  IncidentQueueResponse,
  LiveAction,
} from "@/lib/types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const decisionStyles: Record<LiveAction, string> = {
  allow: "bg-safe/10 text-safe",
  review: "bg-review/15 text-review",
  hold: "bg-block/10 text-block",
  block: "bg-block/15 text-block",
};

const decisionLabels: Record<LiveAction, string> = {
  allow: "Allow",
  review: "Review",
  hold: "Hold",
  block: "Block",
};

const REFRESH_BATCH_SIZE = 6;
const REFRESH_INTERVAL_MS = 15000;
const PAGE_SIZE_OPTIONS = [6, 8, 12, 16];

type FilterValue = "all" | "block" | "hold" | "review";
type SortValue = "risk" | "newest";
type QueueFilters = {
  minAmountInput: string;
  maxAmountInput: string;
  minRisk: number;
};

export function IncidentQueueWorkspace({
  initialQueue,
}: {
  initialQueue: IncidentQueueResponse;
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [pendingQueue, setPendingQueue] = useState<IncidentQueueResponse | null>(null);
  const [pendingThreatCount, setPendingThreatCount] = useState(0);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [queueFilters, setQueueFilters] = useState<QueueFilters>({
    minAmountInput: "",
    maxAmountInput: "",
    minRisk: 0,
  });
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [panel, setPanel] = useState<IncidentPanelResponse | null>(null);
  const [isPanelLoading, setIsPanelLoading] = useState(false);
  const [isClosingPanel, setIsClosingPanel] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  function applyPendingQueue() {
    if (!pendingQueue) {
      return;
    }

    setQueue(pendingQueue);
    setPendingQueue(null);
    setPendingThreatCount(0);
  }

  function finalizePanelClose() {
    setSelectedIncidentId(null);
    setPanel(null);
    setIsPanelLoading(false);
    setIsClosingPanel(false);
    applyPendingQueue();
  }

  function closePanel() {
    if (!selectedIncidentId || isClosingPanel) {
      return;
    }

    setIsClosingPanel(true);

    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      finalizePanelClose();
      closeTimeoutRef.current = null;
    }, 220);
  }

  function openPanel(incidentId: string) {
    if (selectedIncidentId || isClosingPanel) {
      return;
    }

    setSelectedIncidentId(incidentId);
  }

  async function fetchQueue(batch: number) {
    setIsRefreshing(true);

    try {
      const next = await refreshIncidentQueue(batch);
      setQueueError(null);
      if (selectedIncidentId) {
        const currentIds = new Set(queue.incidents.map((item) => item.incident_id));
        const freshCount = next.incidents.filter((item) => !currentIds.has(item.incident_id)).length;

        setPendingQueue(next);
        setPendingThreatCount((current) => current + freshCount);
        return;
      }

      setQueue(next);
    } catch {
      setQueueError(
        "Live updates are temporarily unavailable. Your current queue is still visible.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!selectedIncidentId || isClosingPanel) {
      return;
    }

    let ignore = false;
    setIsPanelLoading(true);
    setPanel(null);
    setPanelError(null);

    void getIncidentPanel(selectedIncidentId)
      .then((response) => {
        if (!ignore) {
          setPanel(response);
        }
      })
      .catch(() => {
        if (!ignore) {
          setPanelError(
            "Sentinel could not load the triage view for this incident right now.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsPanelLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isClosingPanel, selectedIncidentId]);

  useEffect(() => {
    if (!isLive) {
      return;
    }

    const handle = window.setInterval(() => {
      startTransition(() => {
        void fetchQueue(REFRESH_BATCH_SIZE);
      });
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(handle);
    };
  }, [fetchQueue, isLive]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && selectedIncidentId) {
        closePanel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isClosingPanel, selectedIncidentId]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filter,
    sortBy,
    itemsPerPage,
    queueFilters.minAmountInput,
    queueFilters.maxAmountInput,
    queueFilters.minRisk,
  ]);

  const parsedMinAmount = parseAmountInput(queueFilters.minAmountInput);
  const parsedMaxAmount = parseAmountInput(queueFilters.maxAmountInput);
  const amountRangeInvalid =
    parsedMinAmount !== null && parsedMaxAmount !== null && parsedMinAmount > parsedMaxAmount;
  const activeAdvancedFilterSummary = formatAdvancedFilterSummary({
    minAmount: amountRangeInvalid ? null : parsedMinAmount,
    maxAmount: amountRangeInvalid ? null : parsedMaxAmount,
    minRisk: queueFilters.minRisk,
  });
  const hasAdvancedFilters = Boolean(activeAdvancedFilterSummary);
  const incidents = queue.incidents
    .filter((incident) => (filter === "all" ? true : incident.decision === filter))
    .filter((incident) => {
      if (amountRangeInvalid) {
        return true;
      }

      if (parsedMinAmount !== null && incident.amount < parsedMinAmount) {
        return false;
      }

      if (parsedMaxAmount !== null && incident.amount > parsedMaxAmount) {
        return false;
      }

      return true;
    })
    .filter((incident) => incident.overall_risk * 100 >= queueFilters.minRisk)
    .sort((left, right) => {
      if (sortBy === "newest") {
        return right.generated_at.localeCompare(left.generated_at);
      }

      return right.overall_risk - left.overall_risk;
    });
  const pageCount = Math.max(1, Math.ceil(incidents.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStart = (safeCurrentPage - 1) * itemsPerPage;
  const visibleIncidents = incidents.slice(pageStart, pageStart + itemsPerPage);
  const visibleRangeStart = incidents.length ? pageStart + 1 : 0;
  const visibleRangeEnd = pageStart + visibleIncidents.length;
  const visibleSummary = visibleIncidents.reduce(
    (summary, incident) => {
      if (incident.decision === "block") {
        summary.blocked += 1;
      } else if (incident.decision === "hold") {
        summary.hold += 1;
      } else if (incident.decision === "review") {
        summary.review += 1;
      }

      summary.volume += incident.amount;
      return summary;
    },
    { blocked: 0, hold: 0, review: 0, volume: 0 },
  );

  const panelOpen = Boolean(selectedIncidentId);
  const panelVisible = panelOpen || isClosingPanel;
  const paginationPages = buildPaginationPages(safeCurrentPage, pageCount);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  return (
    <div className="relative space-y-4">
      <section className="rounded-[24px] border border-line/45 bg-surface/84 px-4 py-4 shadow-frame backdrop-blur sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Analyst queue
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-none text-ink">
              Incident dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusPill>{isLive ? "Live stream" : "Stream paused"}</StatusPill>
            <StatusPill>
              {queue.generated_at
                ? `Updated ${new Date(queue.generated_at).toLocaleTimeString()}`
                : "Queue warming up"}
            </StatusPill>
            <StatusPill>{queue.stats.monitored_transactions} monitored</StatusPill>
            <StatusPill>{queue.stats.average_latency_ms} ms latency</StatusPill>
            {pendingQueue ? (
              <StatusPill>{pendingThreatCount || "New"} waiting</StatusPill>
            ) : null}
            <button
              type="button"
              onClick={() => setIsLive((current) => !current)}
              className={`rounded-full border px-4 py-2 transition ${
                isLive
                  ? "border-ink bg-ink text-canvas"
                  : "border-line bg-canvas text-ink hover:bg-paper"
              }`}
            >
              {isLive ? "Pause stream" : "Resume stream"}
            </button>
            {pendingQueue ? (
              <button
                type="button"
                onClick={applyPendingQueue}
                className="rounded-full border border-accent/60 bg-accent px-4 py-2 text-canvas transition hover:opacity-90"
              >
                Apply updates
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="min-w-0 rounded-[30px] border border-line/55 bg-surface/94 p-4 shadow-frame backdrop-blur sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/45 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                Prioritized by risk
              </p>
              <h2 className="mt-2 font-serif text-3xl text-ink">Incident queue</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SummaryMetric
                label="Visible"
                value={visibleIncidents.length.toString()}
                tone="safe"
                description="How many incidents are currently visible after the active filters and sort are applied."
              />
              <SummaryMetric
                label="Blocked"
                value={visibleSummary.blocked.toString()}
                tone="block"
                description="Incidents urgent enough that Sentinel recommends blocking the payment and escalating investigation."
              />
              <SummaryMetric
                label="Hold"
                value={visibleSummary.hold.toString()}
                tone="review"
                description="Incidents that should pause the payment until an analyst verifies the transaction."
              />
              <SummaryMetric
                label="Review"
                value={visibleSummary.review.toString()}
                tone="review"
                description="Incidents that need analyst review but are not severe enough to immediately hold or block."
              />
              <SummaryMetric
                label="Volume"
                value={currency.format(visibleSummary.volume)}
                tone="safe"
                description="Visible suspicious transaction volume after all active filters are applied."
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-sm">
              {[
                ["all", "All"],
                ["block", "Block"],
                ["hold", "Hold"],
                ["review", "Review"],
              ].map(([value, label]) => (
                <ToggleChip
                  key={value}
                  active={filter === value}
                  onClick={() => setFilter(value as FilterValue)}
                >
                  {label}
                </ToggleChip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted">
                <span>Per page</span>
                <select
                  value={itemsPerPage}
                  onChange={(event) => setItemsPerPage(Number(event.target.value))}
                  className="rounded-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none transition hover:bg-canvas focus:border-accent"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <span className="text-sm text-muted">
                Showing {visibleRangeStart}-{visibleRangeEnd} of {incidents.length} incidents
              </span>
              <div className="flex flex-wrap gap-2 text-sm">
                {[
                  ["risk", "Highest risk"],
                  ["newest", "Newest first"],
                ].map(([value, label]) => (
                  <ToggleChip
                    key={value}
                    active={sortBy === value}
                    onClick={() => setSortBy(value as SortValue)}
                  >
                    {label}
                  </ToggleChip>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-line/50 bg-canvas/76 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Advanced filters
                </p>
                <p className="mt-1 text-sm text-muted">
                  {hasAdvancedFilters
                    ? activeAdvancedFilterSummary
                    : "Filter by amount range and minimum risk without leaving the queue."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hasAdvancedFilters ? (
                  <button
                    type="button"
                    onClick={() =>
                      setQueueFilters({
                        minAmountInput: "",
                        maxAmountInput: "",
                        minRisk: 0,
                      })
                    }
                    className="rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink transition hover:bg-canvas"
                  >
                    Clear filters
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen((current) => !current)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    isAdvancedOpen
                      ? "border-ink bg-ink text-canvas"
                      : "border-line bg-paper text-ink hover:bg-canvas"
                  }`}
                >
                  {isAdvancedOpen ? "Hide advanced" : "Show advanced"}
                </button>
              </div>
            </div>

            <div
              className={`grid transition-all duration-200 ease-out ${
                isAdvancedOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="grid gap-4 border-t border-line/40 pt-4 lg:grid-cols-[0.9fr_0.9fr_1.2fr]">
                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      Minimum amount
                    </span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="5000"
                      value={queueFilters.minAmountInput}
                      onChange={(event) =>
                        setQueueFilters((current) => ({
                          ...current,
                          minAmountInput: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-[18px] border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      Maximum amount
                    </span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="25000"
                      value={queueFilters.maxAmountInput}
                      onChange={(event) =>
                        setQueueFilters((current) => ({
                          ...current,
                          maxAmountInput: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-[18px] border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                    />
                  </label>

                  <label className="block">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs uppercase tracking-[0.18em] text-muted">
                        Minimum risk
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {Math.round(queueFilters.minRisk)}%+
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={queueFilters.minRisk}
                      onChange={(event) =>
                        setQueueFilters((current) => ({
                          ...current,
                          minRisk: Number(event.target.value),
                        }))
                      }
                      className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-[#2563eb]"
                    />
                  </label>
                </div>

                {amountRangeInvalid ? (
                  <p className="mt-3 text-sm text-block">
                    Minimum amount cannot be greater than maximum amount. Adjust the range to apply the amount filter.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {pendingQueue ? (
            <div className="mt-4 rounded-[18px] border border-accent/45 bg-accent/10 px-4 py-3 text-sm text-ink">
              {pendingThreatCount || "New"} threats arrived in the background.
            </div>
          ) : null}

          {queueError ? (
            <div className="mt-4 rounded-[18px] border border-review/40 bg-review/10 px-4 py-3 text-sm text-ink">
              {queueError}
            </div>
          ) : null}

          <div className="mt-4 space-y-2.5">
              {visibleIncidents.length ? (
                visibleIncidents.map((incident) => {
                const selected = incident.incident_id === selectedIncidentId;

                return (
                  <button
                    key={incident.incident_id}
                    type="button"
                    onClick={() => openPanel(incident.incident_id)}
                    className={`group w-full rounded-[22px] border px-4 py-3.5 text-left transition-all duration-200 ${
                      selected
                        ? "border-accent/60 bg-accent/8 shadow-[0_10px_30px_rgba(42,86,114,0.12)]"
                        : "border-line/55 bg-canvas/78 hover:border-line hover:bg-canvas"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold text-ink">
                            {incident.title}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${decisionStyles[incident.decision]}`}
                          >
                            {decisionLabels[incident.decision]}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-muted">
                          {formatRelativeIncidentTime(incident.generated_at)} ·{" "}
                          {incident.timeline_label}
                        </p>
                        <p className="mt-1 truncate text-sm text-muted">
                          {incident.counterpart_label}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-serif text-[2rem] leading-none text-ink">
                          {Math.round(incident.overall_risk * 100)}%
                        </p>
                        <p className="mt-1.5 text-sm font-medium text-muted">
                          {currency.format(incident.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {incident.top_reasons.slice(0, 2).map((reason) => (
                          <span
                            key={reason}
                            className="rounded-full border border-line/45 bg-surface/88 px-3 py-1 text-xs text-muted"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs uppercase tracking-[0.18em] text-muted transition group-hover:text-ink">
                        {selected ? "Triage open" : "Open triage"}
                      </span>
                    </div>
                  </button>
                );
              })
              ) : (
                <div className="rounded-[22px] border border-dashed border-line/60 bg-canvas/72 px-4 py-6 text-sm text-muted">
                  No incidents match the current filters.
                  {hasAdvancedFilters ? ` Active filters: ${activeAdvancedFilterSummary}.` : ""}
                  {amountRangeInvalid ? " Fix the amount range to apply it." : ""}
                  <button
                    type="button"
                    onClick={() =>
                      setQueueFilters({
                        minAmountInput: "",
                        maxAmountInput: "",
                        minRisk: 0,
                      })
                    }
                    className="ml-2 inline-flex rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink transition hover:bg-canvas"
                  >
                    Reset advanced filters
                  </button>
                </div>
              )}
          </div>

          {incidents.length > itemsPerPage ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/45 pt-4">
              <p className="text-sm text-muted">
                Page {safeCurrentPage} of {pageCount}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <PaginationButton
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  Newer
                </PaginationButton>
                {paginationPages.map((pageNumber) => (
                  <PaginationButton
                    key={pageNumber}
                    active={pageNumber === safeCurrentPage}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationButton>
                ))}
                <PaginationButton
                  disabled={safeCurrentPage === pageCount}
                  onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                >
                  Older
                </PaginationButton>
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          aria-hidden={!panelVisible}
          tabIndex={-1}
          onClick={closePanel}
          className={`fixed inset-0 z-30 border-0 bg-[radial-gradient(circle_at_right,rgba(15,23,42,0.08),transparent_28%),linear-gradient(90deg,rgba(248,250,252,0.08),rgba(15,23,42,0.14))] p-0 backdrop-blur-[3px] transition-opacity duration-200 ease-out ${
            panelVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <aside
          ref={panelRef}
          aria-hidden={!panelVisible}
          className={`fixed inset-y-4 right-4 z-40 w-[min(94vw,42rem)] overflow-visible rounded-[34px] border border-slate-500/70 bg-elevated/97 shadow-[0_30px_90px_rgba(14,36,51,0.2)] backdrop-blur-xl transition-all duration-200 ease-out will-change-transform will-change-opacity transform-gpu ${
            panelVisible
              ? isClosingPanel
                ? "pointer-events-none translate-x-4 opacity-0"
                : "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-4 opacity-0"
          }`}
        >
          <div className="flex h-full max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[34px]">
            <div className="border-b border-slate-400/70 bg-surface/82 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted">
                    Score-first review
                  </p>
                  <h3 className="mt-2 font-serif text-[2.6rem] leading-none text-ink">
                    Triage dock
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                    Review the current incident without sacrificing the main queue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-full border border-slate-400/80 bg-canvas/85 px-4 py-2 text-sm text-ink transition hover:bg-paper"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {isPanelLoading ? (
                <PanelSkeleton />
              ) : panelError ? (
                <div className="rounded-[24px] border border-review/40 bg-review/10 p-4 text-sm leading-7 text-ink">
                  {panelError}
                </div>
              ) : !panel ? (
                <div className="rounded-[24px] border border-review/40 bg-review/10 p-4 text-sm leading-7 text-ink">
                  No triage data is available for this incident right now.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingQueue ? (
                    <div className="rounded-[22px] border border-accent/65 bg-accent/10 px-4 py-3 text-sm text-ink">
                      {pendingThreatCount || "New"} threats are queued in the background. Your
                      current review is pinned until you close this dock or apply the update.
                    </div>
                  ) : null}

                  <div className="rounded-[26px] border border-slate-400/75 bg-canvas/82 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-semibold leading-tight text-ink">
                          {panel.title}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-muted">
                          {panel.timeline_label} · {panel.counterpart_label}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <StatusPill>{currency.format(panel.amount)}</StatusPill>
                          <StatusPill>
                            {panel.ai_mode === "openai" ? "Live OpenAI" : "Fallback reasoning"}
                          </StatusPill>
                        </div>
                      </div>
                      <div className="min-w-[8rem] text-right">
                        <p className="font-serif text-[4.2rem] leading-none text-ink">
                          {Math.round(panel.overall_risk * 100)}%
                        </p>
                        <div className="mt-4 flex justify-end">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] ${decisionStyles[panel.decision]}`}
                          >
                            {decisionLabels[panel.decision]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <RiskBar
                        value={panel.overall_risk}
                        description="Overall fraud risk is Sentinel's combined view of transaction, behavior, and network signals."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <ScoreMetric
                      label="Txn"
                      value={panel.transaction_risk}
                      tooltipAlign="start"
                      description="Transaction risk measures how unusual the payment itself looks compared with expected payment behavior."
                    />
                    <ScoreMetric
                      label="Behavior"
                      value={panel.behavior_risk}
                      tooltipAlign="center"
                      description="Behavior risk measures whether the user's session, timing, device, and flow differ from baseline behavior."
                    />
                    <ScoreMetric
                      label="Network"
                      value={panel.network_risk}
                      tooltipAlign="end"
                      description="Network risk measures whether the recipient or connected accounts are exposed to suspicious paths, rings, or cash-out behavior."
                    />
                  </div>

                  <PanelBlock title="Top signals">
                    <div className="flex flex-wrap gap-2">
                      {panel.top_reasons.map((reason) => (
                        <span
                          key={reason}
                            className="rounded-full border border-slate-400/75 bg-surface/88 px-3 py-1.5 text-xs text-muted"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </PanelBlock>

                  <PanelBlock title="Recommended action">
                    <p className="font-serif text-[2rem] leading-tight text-ink">
                      {panel.recommended_action}
                    </p>
                  </PanelBlock>

                  <PanelBlock title="Why Sentinel escalated this">
                    <p className="text-sm leading-7 text-muted">{panel.explanation}</p>
                    {panel.summary_bullets.length ? (
                      <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
                        {panel.summary_bullets.map((bullet) => (
                          <li key={bullet}>- {bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </PanelBlock>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <Link
                      href={`/incidents/${panel.incident_id}`}
                      className="rounded-full bg-ink px-5 py-3 text-sm text-canvas transition hover:opacity-90"
                    >
                      Open full investigation
                    </Link>
                    <Link
                      href={`/incidents/${panel.incident_id}/graph`}
                      className="rounded-full border border-slate-400/80 bg-canvas/85 px-5 py-3 text-sm text-ink transition hover:bg-paper"
                    >
                      View network exposure
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 transition ${
        active
          ? "border-ink bg-ink text-canvas"
          : "border-line bg-canvas/85 text-ink hover:bg-paper"
      }`}
    >
      {children}
    </button>
  );
}

function PaginationButton({
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        active
          ? "border-ink bg-ink text-canvas"
          : "border-line bg-canvas/85 text-ink hover:bg-paper"
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      {children}
    </button>
  );
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line/40 bg-canvas/78 px-4 py-2 text-sm text-muted">
      {children}
    </span>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
  description,
}: {
  label: string;
  value: string;
  tone: "safe" | "review" | "block";
  description: string;
}) {
  const toneMap = {
    safe: "text-safe",
    review: "text-review",
    block: "text-block",
  };

  return (
    <div className="rounded-[22px] border border-slate-400/80 bg-canvas/88 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
      <div className="flex items-center gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
        <InfoBadge description={description} />
      </div>
      <p className={`mt-3 font-serif text-[2.1rem] leading-none ${toneMap[tone]}`}>
        {value}
      </p>
    </div>
  );
}

function ScoreMetric({
  label,
  value,
  description,
  tooltipAlign = "end",
}: {
  label: string;
  value: number;
  description: string;
  tooltipAlign?: "start" | "center" | "end";
}) {
  return (
    <div className="rounded-[22px] border border-slate-400/80 bg-canvas/90 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
      <div className="flex items-center gap-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
        <InfoBadge description={description} align={tooltipAlign} />
      </div>
      <p className="mt-3 font-serif text-[2rem] leading-none text-ink">
        {Math.round(value * 100)}%
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/45">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(Math.round(value * 100), 6)}%`,
            backgroundColor: riskColor(value),
          }}
        />
      </div>
    </div>
  );
}

function RiskBar({
  value,
  description,
}: {
  value: number;
  description: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <div className="flex items-center gap-2">
          <span>Overall fraud risk</span>
          <InfoBadge description={description} align="start" />
        </div>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-line/45">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(Math.round(value * 100), 6)}%`,
            backgroundColor: riskColor(value),
          }}
        />
      </div>
    </div>
  );
}

function InfoBadge({
  description,
  align = "end",
}: {
  description: string;
  align?: "start" | "center" | "end";
}) {
  const alignmentClassName =
    align === "start"
      ? "left-0"
      : align === "center"
        ? "left-1/2 -translate-x-1/2"
        : "right-0";

  return (
    <span className="group relative inline-flex">
      <span
        className="inline-flex h-[19px] w-[19px] cursor-help items-center justify-center rounded-full border border-slate-400/80 bg-white text-[11px] font-semibold leading-none text-slate-600 shadow-sm"
        aria-label={description}
        tabIndex={0}
      >
        i
      </span>
      <span
        className={`pointer-events-none absolute top-[calc(100%+0.45rem)] z-50 w-56 max-w-[min(18rem,calc(100vw-3rem))] rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[12px] normal-case leading-5 text-slate-50 opacity-0 shadow-2xl transition-opacity duration-75 group-hover:opacity-100 group-focus-within:opacity-100 ${alignmentClassName}`}
      >
        {description}
      </span>
    </span>
  );
}

function riskColor(value: number) {
  if (value >= 0.75) {
    return "#c2410c";
  }

  if (value >= 0.45) {
    return "#b7791f";
  }

  return "#0f766e";
}

function PanelBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-400/80 bg-canvas/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="mt-4 space-y-4 animate-pulse">
      <div className="h-28 rounded-[24px] bg-canvas/75" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 rounded-[20px] bg-canvas/75" />
        <div className="h-24 rounded-[20px] bg-canvas/75" />
        <div className="h-24 rounded-[20px] bg-canvas/75" />
      </div>
      <div className="h-36 rounded-[24px] bg-canvas/75" />
      <div className="h-28 rounded-[24px] bg-canvas/75" />
      <div className="h-36 rounded-[24px] bg-canvas/75" />
    </div>
  );
}

function parseAmountInput(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function formatAdvancedFilterSummary({
  minAmount,
  maxAmount,
  minRisk,
}: {
  minAmount: number | null;
  maxAmount: number | null;
  minRisk: number;
}) {
  const parts: string[] = [];

  if (minAmount !== null && maxAmount !== null) {
    parts.push(`Amount: ${currency.format(minAmount)}-${currency.format(maxAmount)}`);
  } else if (minAmount !== null) {
    parts.push(`Amount: ${currency.format(minAmount)}+`);
  } else if (maxAmount !== null) {
    parts.push(`Amount: up to ${currency.format(maxAmount)}`);
  }

  if (minRisk > 0) {
    parts.push(`Risk: ${Math.round(minRisk)}%+`);
  }

  return parts.join(" · ");
}

function formatRelativeIncidentTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}

function buildPaginationPages(currentPage: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}
