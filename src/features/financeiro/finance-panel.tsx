"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Wallet, DollarSign, Package, Percent, Target, BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { formatBRL, formatPercent } from "@/lib/format";
import { getFinanceData, type FinanceFilters, type FinancePeriod } from "@/app/actions/finance";
import { FinanceChart } from "@/features/financeiro/finance-chart";

const PERIODS: { value: FinancePeriod; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
  { value: "custom", label: "Personalizado" },
];

function Indicator({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className="surface-card rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <p className="label-caps">{label}</p>
      </div>
      <p
        className={`mt-2 font-display text-2xl font-bold tracking-tight tabular-nums ${accent ? "text-primary" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="surface-card rounded-2xl p-4 sm:p-5">
      <p className="label-caps">{label}</p>
      <p
        className={`mt-2 font-display text-2xl font-bold tracking-tight tabular-nums ${accent ? "text-primary" : ""}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FinancePanel() {
  const [filters, setFilters] = useState<FinanceFilters>({ period: "month" });
  const [data, setData] = useState<Awaited<ReturnType<typeof getFinanceData>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getFinanceData(filters).then((d) => {
      setData(d);
      setIsLoading(false);
    });
  }, [filters]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Financeiro"
        title="Visão financeira"
        description="Acompanhe receita, custos, lucros e indicadores da operação em tempo real."
      />

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setFilters({ period: p.value })}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              filters.period === p.value
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-surface text-muted-foreground hover:bg-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {filters.period === "custom" && (
        <div className="mb-6 flex flex-wrap gap-3">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            className="surface-card rounded-xl px-3 py-2 text-sm outline-none"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            className="surface-card rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>
      )}

      {isLoading || !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-card h-28 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Principais métricas */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Receita" value={formatBRL(data.revenue)} accent />
            <MetricCard label="Custos" value={formatBRL(data.costs)} />
            <MetricCard
              label="Lucro bruto"
              value={formatBRL(data.grossProfit)}
              accent={data.grossProfit > 0}
              hint="Receita - custos"
            />
            <MetricCard label="Lucro disponível" value={formatBRL(data.availableProfit)} />
            <MetricCard label="Reinvestimento" value={formatBRL(data.reinvestment)} />
            <MetricCard label="Despesas" value={formatBRL(data.expenses)} />
          </section>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <MetricCard
              label="Resultado líquido"
              value={formatBRL(data.netResult)}
              accent={data.netResult > 0}
              hint="Lucro bruto - despesas"
            />
            <MetricCard
              label="Custos de importação"
              value={formatBRL(data.importCosts)}
              hint="Total investido em importações"
            />
          </div>

          {/* Indicadores */}
          <section className="mt-6">
            <h2 className="font-display text-lg font-semibold">Indicadores</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Indicator
                label="Margem de lucro"
                value={formatPercent(data.margin)}
                icon={Percent}
                accent
              />
              <Indicator label="ROI" value={formatPercent(data.roi)} icon={TrendingUp} />
              <Indicator label="Ticket médio" value={formatBRL(data.averageTicket)} icon={DollarSign} />
              <Indicator
                label="Lucro médio por peça"
                value={formatBRL(data.averageProfitPerPiece)}
                icon={Target}
              />
              <Indicator
                label="Custo médio por peça"
                value={formatBRL(data.averageCostPerPiece)}
                icon={Package}
              />
              <Indicator
                label="Quantidade vendida"
                value={String(data.piecesSold)}
                icon={BarChart3}
              />
            </div>
          </section>

          {/* Gráficos */}
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <FinanceChart
              data={data.points}
              title="Receita por período"
              dataKeys={[{ key: "revenue", label: "Receita" }]}
              colors={["#FFD400"]}
              type="bar"
            />
            <FinanceChart
              data={data.points}
              title="Lucro por período"
              dataKeys={[{ key: "profit", label: "Lucro" }]}
              colors={["#22c55e"]}
              type="line"
            />
            <FinanceChart
              data={data.points}
              title="Reinvestimento"
              dataKeys={[{ key: "reinvestment", label: "Reinvestimento" }]}
              colors={["#9ca3af"]}
              type="bar"
            />
            <FinanceChart
              data={data.points}
              title="Dinheiro disponível"
              dataKeys={[{ key: "available", label: "Disponível" }]}
              colors={["#FFD400"]}
              type="line"
            />
          </section>
        </>
      )}
    </div>
  );
}
