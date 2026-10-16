"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PeriodPoint } from "@/app/actions/finance";
import { formatBRL } from "@/lib/format";

type ChartType = "bar" | "line";

export function FinanceChart({
  data,
  title,
  dataKeys,
  colors,
  type = "bar",
}: {
  data: PeriodPoint[];
  title: string;
  dataKeys: { key: keyof PeriodPoint; label: string }[];
  colors: string[];
  type?: ChartType;
}) {
  const hasData = data.some((p) => dataKeys.some((k) => Number(p[k.key]) > 0));

  return (
    <div className="surface-card rounded-2xl p-4 sm:p-5">
      <h3 className="font-display text-base font-semibold">{title}</h3>

      {hasData ? (
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  cursor={{ fill: "currentColor", opacity: 0.06 }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--foreground)",
                  }}
                  formatter={(value, name) => [formatBRL(Number(value ?? 0)), String(name)]}
                />
                {dataKeys.map((k, i) => (
                  <Bar
                    key={String(k.key)}
                    dataKey={String(k.key)}
                    name={k.label}
                    fill={colors[i]}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--foreground)",
                  }}
                  formatter={(value, name) => [formatBRL(Number(value ?? 0)), String(name)]}
                />
                {dataKeys.map((k, i) => (
                  <Line
                    key={String(k.key)}
                    type="monotone"
                    dataKey={String(k.key)}
                    name={k.label}
                    stroke={colors[i]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: colors[i] }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-4 text-sm text-muted-foreground">
          Nenhum dado no período selecionado.
        </p>
      )}
    </div>
  );
}
