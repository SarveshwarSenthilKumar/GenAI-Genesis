import type { PropsWithChildren, ReactNode } from "react";

type SectionCardProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}>;

export function SectionCard({
  title,
  eyebrow,
  action,
  className = "",
  children,
}: SectionCardProps) {
  return (
    <section
      className={`rounded-[28px] border border-line/80 bg-panel/95 p-6 shadow-frame ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 font-serif text-2xl text-ink">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

