"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { RiskDistributionItem } from "@/lib/types";

const BAR_COLORS = ["#16805d", "#d98a1b", "#b9382f"];

type RiskDistributionChartProps = {
  data: RiskDistributionItem[];
};

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <Bar dataKey="count" radius={[10, 10, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={BAR_COLORS[index] ?? "#0e2433"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

