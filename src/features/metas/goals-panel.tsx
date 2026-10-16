"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Target, Trash2, CheckCircle2, Calendar } from "lucide-react";

import type { Goal } from "@/db/schema";
import { PageHeader } from "@/components/layout/page-header";
import { formatBRL, formatPercent } from "@/lib/format";
import { listGoals, createGoal, deleteGoal, completeGoal, type GoalFormData } from "@/app/actions/goals";
import { calculateGoalProgress, calculateGoalProjection } from "@/features/metas/goal-math";
import { GoalFormDialog } from "@/features/metas/goal-form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export function GoalsPanel() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Goal | null>(null);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    const data = await listGoals();
    setGoals(data);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const activeGoal = useMemo(() => goals.find((g) => g.status === "active") ?? null, [goals]);

  const handleSave = async (data: GoalFormData) => {
    try {
      await createGoal(data);
      toast.success(`Meta "${data.name}" criada! Boa sorte 🎯`);
      setDialogOpen(false);
      await load();
    } catch {
      toast.error("Não foi possível criar a meta.");
    }
  };

  const handleDelete = async (goal: Goal) => {
    try {
      await deleteGoal(goal.id);
      toast.success(`Meta "${goal.name}" excluída.`);
      await load();
    } catch {
      toast.error("Não foi possível excluir a meta.");
    }
  };

  const handleComplete = async (goal: Goal) => {
    try {
      await completeGoal(goal.id);
      toast.success(`Parabéns! Meta "${goal.name}" concluída. 🎉`);
      await load();
    } catch {
      toast.error("Não foi possível concluir a meta.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Financeiro"
        title="Metas"
        description="Objetivos financeiros baseados no lucro disponível das vendas."
        action={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:px-4 sm:py-2.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova meta</span>
            <span className="sm:hidden">Meta</span>
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="surface-card h-64 animate-pulse rounded-2xl" />
        </div>
      ) : activeGoal ? (
        <ActiveGoalCard goal={activeGoal} onComplete={() => void handleComplete(activeGoal)} />
      ) : (
        <section className="surface-card rounded-2xl p-6 text-center sm:p-10">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nenhuma meta ativa ainda.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Crie uma meta para acompanhar progresso, valor restante e quantas peças faltam.
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nova meta
          </button>
        </section>
      )}

      {/* Histórico de metas */}
      {goals.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-semibold">Histórico de metas</h2>
          <div className="mt-4 space-y-3">
            {goals.map((goal) => (
              <GoalHistoryRow
                key={goal.id}
                goal={goal}
                onDelete={() => setConfirmTarget(goal)}
              />
            ))}
          </div>
        </div>
      )}

      <GoalFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} />

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Excluir meta"
        description={`Tem certeza que deseja excluir "${confirmTarget?.name ?? ""}"? O progresso registrado será perdido.`}
        confirmLabel="Excluir"
        onConfirm={() => confirmTarget && void handleDelete(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}

function ActiveGoalCard({
  goal,
  onComplete,
}: {
  goal: Goal;
  onComplete: () => void;
}) {
  const progress = calculateGoalProgress(
    Number(goal.currentAmount),
    Number(goal.targetAmount),
    Number(goal.profitPerPiece),
  );

  return (
    <section className="surface-card rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="label-caps">Meta atual</p>
            <h2 className="font-display text-xl font-semibold">{goal.name}</h2>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 font-display text-sm font-bold text-primary-foreground tabular-nums">
          {formatPercent(progress.percentComplete)}
        </span>
      </div>

      <div
        className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(progress.percentComplete)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Valor da meta" value={formatBRL(progress.targetAmount)} />
        <Stat label="Alcançado" value={formatBRL(progress.currentAmount)} accent />
        <Stat label="Restante" value={formatBRL(progress.remainingAmount)} />
        <Stat label="Lucro disponível / peça" value={formatBRL(Number(goal.profitPerPiece))} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Peças vendidas" value={`${progress.piecesSold} / ${goal.piecesNeeded}`} />
        <Stat label="Peças restantes" value={String(progress.piecesRemaining)} />
        <Stat label="Faturamento necessário" value={formatBRL(Number(goal.salePrice) * goal.piecesNeeded)} />
      </div>

      {progress.percentComplete >= 100 && (
        <div className="mt-5 rounded-xl bg-primary/10 p-4 text-center">
          <p className="font-display text-base font-semibold text-primary">🎉 Meta atingida!</p>
          <button
            type="button"
            onClick={onComplete}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <CheckCircle2 className="h-4 w-4" />
            Concluir meta
          </button>
        </div>
      )}
    </section>
  );
}

function GoalHistoryRow({
  goal,
  onDelete,
}: {
  goal: Goal;
  onDelete: () => void;
}) {
  const progress = calculateGoalProgress(
    Number(goal.currentAmount),
    Number(goal.targetAmount),
    Number(goal.profitPerPiece),
  );

  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold">{goal.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBRL(progress.currentAmount)} de {formatBRL(progress.targetAmount)} ·{" "}
          {formatPercent(progress.percentComplete)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${
            goal.status === "active"
              ? "bg-primary/10 text-primary"
              : goal.status === "completed"
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {goal.status === "active" ? "Ativa" : goal.status === "completed" ? "Concluída" : "Cancelada"}
        </span>
        <button
          type="button"
          onClick={onDelete}
          data-tooltip="Excluir meta"
          className="tooltip rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Excluir meta"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-3">
      <p className="label-caps">{label}</p>
      <p className={`mt-1 font-display text-base font-bold tabular-nums ${accent ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
