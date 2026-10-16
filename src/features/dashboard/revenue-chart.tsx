"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import type { MonthPoint } from "@/features/dashboard/use-dashboard-data";
import { formatBRL } from "@/lib/format";

export function RevenueChart({ data }: { data: MonthPoint[] }) {
  const hasData = data.some((point) => point.receita > 0 || point.lucro > 0);

  return (
    <section className="surface-card rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label-caps">Últimos 6 meses</p>
          <h2 className="mt-1 text-lg font-semibold">Receita e lucro realizados</h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Receita
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/60" /> Lucro
          </span>
        </div>
      </div>

      {hasData ? (
        <div className="mt-5 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.4} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "currentColor", fontSize: 12 }}
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
                formatter={(value, name) => [
                  formatBRL(Number(value ?? 0)),
                  name === "receita" ? "Receita" : "Lucro",
                ]}
              />
              <Bar dataKey="receita" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={38} />
              <Bar
                dataKey="lucro"
                fill="var(--muted-foreground)"
                fillOpacity={0.6}
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-surface/50 p-5 text-sm text-muted-foreground">
          Nenhuma venda registrada ainda. Os gráficos aparecem assim que você lançar a primeira venda.
        </p>
      )}
    </section>
  );
}
