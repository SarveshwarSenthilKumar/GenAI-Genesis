type ScoreBreakdownProps = {
  items: Array<{ label: string; value: number; tone: "safe" | "review" | "block" }>;
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
              className="h-3 rounded-full transition-colors"
              style={{
                width: `${Math.max(item.value * 100, 2.5)}%`,
                backgroundColor: riskColor(item.value),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function riskColor(value: number) {
  if (value <= 0.15) {
    return "#15803d";
  }

  if (value <= 0.4) {
    return "#65a30d";
  }

  if (value <= 0.65) {
    return "#ca8a04";
  }

  if (value <= 0.85) {
    return "#ea580c";
  }

  return "#dc2626";
}
