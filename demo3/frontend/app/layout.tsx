import Link from "next/link";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Sentinel Fraud Console",
  description: "Real-time fraud intelligence using behavioral identity and network risk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10">
          <header className="mb-10 flex flex-col gap-4 rounded-[30px] border border-line/70 bg-panel/85 px-6 py-5 shadow-frame lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">
                TD Fraud Intelligence Demo
              </p>
              <Link href="/" className="mt-2 block font-serif text-4xl text-ink">
                Sentinel
              </Link>
            </div>
            <nav className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <Link className="rounded-full border border-line px-4 py-2 hover:bg-paper" href="/">
                Dashboard
              </Link>
              <Link
                className="rounded-full border border-line px-4 py-2 hover:bg-paper"
                href="/cases/tx_blocked_001"
              >
                Flagged Case
              </Link>
              <Link
                className="rounded-full border border-line px-4 py-2 hover:bg-paper"
                href="/cases/tx_blocked_001/graph"
              >
                Graph View
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

