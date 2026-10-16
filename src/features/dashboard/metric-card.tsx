import type { FinanceMetric } from "@/features/dashboard/use-dashboard-data";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MetricCard({ metric }: { metric: FinanceMetric }) {
  return (
    <article
      className={cn(
        "surface-card group relative overflow-hidden rounded-2xl p-4 transition-colors sm:p-5",
        metric.emphasis === "primary" && "glow-primary",
      )}
    >
      {metric.emphasis === "primary" && (
        <span className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/15 blur-2xl" />
      )}

      <p className="label-caps">{metric.label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-bold tracking-tight tabular-nums sm:text-[1.75rem]",
          metric.emphasis === "primary" && "text-primary",
          metric.emphasis === "positive" && metric.value >= 0 && "text-success",
          metric.value < 0 && "text-destructive",
        )}
      >
        {formatBRL(metric.value)}
      </p>

      <p className="mt-3 min-w-0 truncate text-xs text-muted-foreground">{metric.hint}</p>
    </article>
  );
}
