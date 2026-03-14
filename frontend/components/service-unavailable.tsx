import Link from "next/link";

export function ServiceUnavailable({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="space-y-8">
      <section className="rounded-[30px] border border-line/70 bg-panel/90 p-8 shadow-frame">
        <p className="text-xs uppercase tracking-[0.24em] text-muted">Sentinel status</p>
        <h1 className="mt-3 font-serif text-5xl text-ink">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href="/"
            className="rounded-full bg-ink px-5 py-3 text-paper transition hover:opacity-90"
          >
            Back to queue
          </Link>
          <span className="rounded-full border border-line px-4 py-3 text-muted">
            Check that the FastAPI backend is running and reachable
          </span>
        </div>
      </section>
    </main>
  );
}
