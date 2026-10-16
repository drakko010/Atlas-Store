"use client";

import Link from "next/link";
import { Plus, Target } from "lucide-react";

import type { DashboardGoal } from "@/features/dashboard/use-dashboard-data";
import { formatBRL, formatNumber, formatPercent } from "@/lib/format";

export function GoalPanel({ goal }: { goal: DashboardGoal | null }) {
  if (!goal) {
    return (
      <section className="surface-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="label-caps">Meta atual</p>
            <h2 className="text-lg font-semibold">Nenhuma meta ativa ainda.</h2>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Crie uma meta para acompanhar progresso, valor restante e quantas peças faltam.
        </p>
        <Link
          href="/metas"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface"
        >
          <Plus className="h-4 w-4" />
          Nova meta
        </Link>
      </section>
    );
  }

  const remaining = Math.max(goal.targetValue - goal.currentValue, 0);
  const progress =
    goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;
  const piecesNeeded = goal.averageTicket > 0 ? Math.ceil(remaining / goal.averageTicket) : null;

  const stats = [
    { label: "Valor da meta", value: formatBRL(goal.targetValue) },
    { label: "Alcançado", value: formatBRL(goal.currentValue), accent: true },
    { label: "Restante", value: formatBRL(remaining) },
    {
      label: "Peças necessárias",
      value: piecesNeeded === null ? "—" : `${formatNumber(piecesNeeded)} un.`,
    },
  ];

  return (
    <section className="surface-card rounded-2xl p-5 sm:p-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="label-caps">Meta atual</p>
            <h2 className="truncate text-lg font-semibold">{goal.name}</h2>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 font-display text-sm font-bold text-primary-foreground tabular-nums">
          {formatPercent(progress)}
        </span>
      </div>

      <div
        className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso da meta ${goal.name}`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface/60 p-3">
            <dt className="label-caps">{stat.label}</dt>
            <dd
              className={`mt-1 font-display text-base font-bold tabular-nums ${stat.accent ? "text-primary" : ""}`}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
