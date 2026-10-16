"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardEmptyState } from "@/features/dashboard/empty-state";
import { GoalPanel } from "@/features/dashboard/goal-panel";
import { MetricCard } from "@/features/dashboard/metric-card";
import { RevenueChart } from "@/features/dashboard/revenue-chart";
import { useDashboardData } from "@/features/dashboard/use-dashboard-data";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { data, isPending, error } = useDashboardData();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description="Resumo financeiro e operacional da loja, calculado a partir dos seus dados."
        action={
          <Link
            href="/importacoes"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:px-4 sm:py-2.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova importação</span>
            <span className="sm:hidden">Importação</span>
          </Link>
        }
      />

      {isPending && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[7.5rem] rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <section className="surface-card rounded-2xl p-6 text-sm text-muted-foreground">
          Não foi possível carregar os dados agora. Tente novamente mais tarde.
        </section>
      )}

      {data && (
        <>
          {data.counts.importations === 0 && data.counts.products === 0 ? (
            <DashboardEmptyState />
          ) : (
            <section
              aria-label="Indicadores financeiros"
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              {data.metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </section>
          )}

          <div className="mt-6 grid gap-6">
            <GoalPanel goal={data.goal} />
            <RevenueChart data={data.monthly} />
          </div>
        </>
      )}
    </div>
  );
}
