"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  type TooltipContentProps,
} from "recharts";
import type { ScoreTrendPoint } from "@/lib/dashboard/stats";

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as ScoreTrendPoint;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground">
        {point.date} · attempt #{point.attempt}
      </p>
      <p className="mt-0.5 font-medium text-foreground">{point.score} / 100</p>
    </div>
  );
}

export function ScoreTrendChart({ data }: { data: ScoreTrendPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="attempt"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickFormatter={(v) => `#${v}`}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 40, 70, 100]}
            tickLine={false}
            axisLine={false}
            width={32}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <ReferenceLine y={70} stroke="hsl(var(--success))" strokeDasharray="3 3" strokeOpacity={0.45} />
          <ReferenceLine y={40} stroke="hsl(var(--warning))" strokeDasharray="3 3" strokeOpacity={0.45} />
          <Tooltip content={ChartTooltip} cursor={{ stroke: "hsl(var(--border))" }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            fill="url(#scoreTrendFill)"
            dot={{ r: 3, fill: "hsl(var(--accent))", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
