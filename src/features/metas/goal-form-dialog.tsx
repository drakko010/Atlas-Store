"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import type { GoalFormData } from "@/app/actions/goals";
import { calculateGoalProjection } from "@/features/metas/goal-math";
import { formatBRL } from "@/lib/format";

function parseMoney(value: string): number {
  let cleaned = value.replace(/[^\d,.-]/g, "");
  const dots = (cleaned.match(/\./g) ?? []).length;
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");
  } else if (dots > 1) {
    cleaned = cleaned.replace(/\./g, "");
  }
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}

export function GoalFormDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: GoalFormData) => void;
}) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("3.000,00");
  const [salePrice, setSalePrice] = useState("500,00");
  const [unitCost, setUnitCost] = useState("100,00");
  const [deadline, setDeadline] = useState("");
  const [split, setSplit] = useState({ available: 50, reinvestment: 50 });

  const projection = useMemo(() => {
    return calculateGoalProjection({
      targetAmount: parseMoney(targetAmount),
      salePrice: parseMoney(salePrice),
      unitCost: parseMoney(unitCost),
      availablePercentage: split.available,
      reinvestmentPercentage: split.reinvestment,
    });
  }, [targetAmount, salePrice, unitCost, split]);

  useEffect(() => {
    if (!open) {
      setName("");
      setTargetAmount("3.000,00");
      setSalePrice("500,00");
      setUnitCost("100,00");
      setDeadline("");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      targetAmount: parseMoney(targetAmount),
      salePrice: parseMoney(salePrice),
      unitCost: parseMoney(unitCost),
      deadline: deadline || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-semibold">Nova meta</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4">
            <Field label="Nome da meta" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Notebook"
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
              />
            </Field>

            <Field label="Valor da meta" required>
              <div className="flex overflow-hidden rounded-xl border border-border bg-background">
                <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                  className="w-full bg-transparent px-3 py-3 text-base outline-none"
                />
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preço de venda por peça" required>
                <div className="flex overflow-hidden rounded-xl border border-border bg-background">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    required
                    className="w-full bg-transparent px-3 py-3 text-base outline-none"
                  />
                </div>
              </Field>
              <Field label="Custo unitário" required>
                <div className="flex overflow-hidden rounded-xl border border-border bg-background">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    required
                    className="w-full bg-transparent px-3 py-3 text-base outline-none"
                  />
                </div>
              </Field>
            </div>

            <Field label="Divisão do lucro">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-surface/50 p-3">
                  <p className="text-xs text-muted-foreground">Disponível</p>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={split.available}
                      onChange={(e) =>
                        setSplit({
                          available: Number(e.target.value),
                          reinvestment: 100 - Number(e.target.value),
                        })
                      }
                      className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none"
                    />
                    <span className="text-sm">%</span>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface/50 p-3">
                  <p className="text-xs text-muted-foreground">Reinvestimento</p>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={split.reinvestment}
                      onChange={(e) =>
                        setSplit({
                          reinvestment: Number(e.target.value),
                          available: 100 - Number(e.target.value),
                        })
                      }
                      className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none"
                    />
                    <span className="text-sm">%</span>
                  </div>
                </div>
              </div>
            </Field>

            <Field label="Prazo">
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
              />
            </Field>

            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-display text-sm font-semibold">Projeção da meta</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lucro disponível por peça</span>
                  <span className="font-medium">{formatBRL(projection.availableProfitPerPiece)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Peças necessárias</span>
                  <span className="font-medium">{projection.piecesNeeded}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Faturamento necessário</span>
                  <span className="font-medium">{formatBRL(projection.requiredRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Custo total</span>
                  <span className="font-medium">{formatBRL(projection.requiredCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lucro total</span>
                  <span className="font-medium">{formatBRL(projection.requiredProfit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reinvestimento</span>
                  <span className="font-medium">{formatBRL(projection.requiredReinvestment)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Disponível</span>
                  <span className="font-medium text-primary">{formatBRL(projection.requiredAvailable)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Criar meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
