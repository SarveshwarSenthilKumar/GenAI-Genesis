type ScoreBreakdownProps = {
  items: Array<{ label: string; value: number; tone: "safe" | "review" | "block" }>;
};

const toneClasses = {
  safe: "bg-safe",
  review: "bg-review",
  block: "bg-block",
};

export function ScoreBreakdown({ items }: ScoreBreakdownProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm text-ink">
            <span>{item.label}</span>
            <span>{Math.round(item.value * 100)}%</span>
          </div>
          <div className="h-3 rounded-full bg-line/50">
            <div
              className={`h-3 rounded-full ${toneClasses[item.tone]}`}
              style={{ width: `${Math.max(item.value * 100, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

