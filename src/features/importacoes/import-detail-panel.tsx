"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Copy, PackagePlus, Pencil, Trash2 } from "lucide-react";

import type { ImportationWithItems } from "@/app/actions/importations";
import {
  addImportationToStock,
  deleteImportation,
  duplicateImportation,
  updateImportationStatus,
} from "@/app/actions/importations";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatBRL } from "@/lib/format";
import { toNumber } from "@/lib/database";
import {
  calculateImportation,
  canReceiveStock,
  isInProgress,
  statusMeta,
  STATUS_FLOW,
  type ImportationStatus,
} from "@/features/importacoes/import-math";

function InfoCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="surface-card rounded-2xl p-4">
      <p className="label-caps">{label}</p>
      <p className={`mt-1 font-display text-lg font-bold tabular-nums ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

export function ImportDetailPanel({ importation }: { importation: ImportationWithItems }) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<string>(importation.status);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmStock, setConfirmStock] = useState(false);

  const symbol = importation.currency === "USD" ? "US$" : "¥";
  const meta = statusMeta(status);

  const calculation = calculateImportation(
    importation.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: toNumber(i.unitPrice),
      unitWeight: toNumber(i.unitWeight),
    })),
    {
      exchangeRate: toNumber(importation.exchangeRate),
      shipping: toNumber(importation.shippingCost),
      fees: toNumber(importation.fees),
      insurance: toNumber(importation.insurance),
      taxesBRL: toNumber(importation.taxes),
      otherBRL: toNumber(importation.otherCosts),
    },
  );

  const handleChangeStatus = async (next: string) => {
    setStatus(next);
    const result = await updateImportationStatus(importation.id, next as ImportationStatus);
    if (result.ok) {
      toast.success(`Status alterado para ${statusMeta(next).label}.`);
    } else {
      toast.error(result.error);
    }
  };

  const handleStock = async () => {
    const result = await addImportationToStock(importation.id);
    if (result.ok) {
      toast.success("✓ Estoque atualizado com sucesso!");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleDuplicate = async () => {
    const result = await duplicateImportation(importation.id);
    if (result.ok) {
      toast.success("Importação duplicada.");
      router.push(`/imports/${result.id}`);
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    const result = await deleteImportation(importation.id);
    if (result.ok) {
      toast.success(result.archived ? "Importação arquivada para preservar o histórico." : "Importação excluída.");
      router.push("/imports");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Link href="/imports" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Importações
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{importation.name}</h1>
              <span
                className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${
                  status === "cancelled"
                    ? "bg-destructive/10 text-destructive"
                    : status === "received" || status === "completed"
                      ? "bg-success/10 text-success"
                      : "bg-primary/10 text-primary"
                }`}
              >
                {meta.emoji} {meta.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {importation.method === "uscloser" ? "🇺🇸 US Closer" : "🇨🇳 CSSBuy"} · {importation.originCountry} → Brasil ·{" "}
              {importation.importDate ? new Date(`${importation.importDate}T12:00:00`).toLocaleDateString("pt-BR") : "—"}
              {importation.supplier ? ` · ${importation.supplier}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Câmbio congelado: <span className="font-semibold text-foreground">R$ {toNumber(importation.exchangeRate).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}</span>{" "}
              por {importation.currency}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => void handleChangeStatus(e.target.value)}
              className="surface-card rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
              aria-label="Alterar status"
            >
              {STATUS_FLOW.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.emoji} {s.label}
                </option>
              ))}
              <option value="cancelled">❌ Cancelado</option>
            </select>
            <Link
              href={`/imports/${importation.id}/editar`}
              data-tooltip="Editar"
              className="tooltip rounded-xl border border-border bg-surface p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => void handleDuplicate()}
              data-tooltip="Duplicar"
              className="tooltip rounded-xl border border-border bg-surface p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Duplicar"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              data-tooltip="Excluir"
              className="tooltip rounded-xl border border-border bg-surface p-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Entrada no estoque */}
      <div className="surface-card mb-6 rounded-2xl p-4 sm:p-5">
        {importation.stockAdded ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="font-display text-sm font-semibold text-success">✓ Estoque atualizado</p>
              <p className="text-xs text-muted-foreground">Os produtos desta importação já foram adicionados ao estoque.</p>
            </div>
          </div>
        ) : canReceiveStock(status) ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-sm font-semibold">Mercadoria recebida?</p>
              <p className="text-xs text-muted-foreground">
                Adicione os {calculation.totals.totalPieces} produto(s) ao estoque com o custo real rateado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmStock(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <PackagePlus className="h-4 w-4" />
              Adicionar ao estoque
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {status === "cancelled"
              ? "Importação cancelada — sem entrada no estoque."
              : "Quando o status for 📥 Recebido ou ✅ Finalizado, você poderá adicionar os produtos ao estoque."}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {/* Resumo financeiro */}
          <section>
            <h2 className="font-display text-lg font-semibold">Resumo financeiro</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <InfoCard label={`Produtos (${symbol})`} value={`${symbol} ${calculation.totals.productForeign.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
              <InfoCard label="Produtos (BRL)" value={formatBRL(calculation.totals.productBRL)} />
              <InfoCard label="Frete" value={formatBRL(calculation.totals.shippingBRL)} />
              <InfoCard label="Taxas" value={formatBRL(calculation.totals.feesBRL)} />
              <InfoCard label="Seguro" value={formatBRL(calculation.totals.insuranceBRL)} />
              <InfoCard label="Impostos" value={formatBRL(calculation.totals.taxesBRL)} />
              <InfoCard label="Outros" value={formatBRL(calculation.totals.otherBRL)} />
              <InfoCard label="Qtd. total" value={`${calculation.totals.totalPieces} pç`} />
              <InfoCard label="Custo médio/peça" value={formatBRL(calculation.totals.averageCostPerPiece)} />
            </div>
            <div className="surface-card glow-primary mt-3 rounded-2xl p-4 sm:p-5">
              <p className="label-caps">Custo total da importação</p>
              <p className="mt-1 font-display text-3xl font-bold tracking-tight text-primary tabular-nums">
                {formatBRL(calculation.totals.totalBRL)}
              </p>
            </div>
          </section>

          {/* Produtos */}
          <section>
            <h2 className="font-display text-lg font-semibold">Produtos e custo real</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Custos compartilhados rateados pelo valor dos produtos.
            </p>
            <div className="mt-3 space-y-3">
              {calculation.items.map((item) => {
                const source = importation.items.find((i) => i.productId === item.productId);
                return (
                  <div key={item.productId} className="surface-card rounded-2xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display font-semibold">{source?.productName ?? "Produto"}</p>
                      <span className="text-xs text-muted-foreground">
                        {item.quantity} un. × {symbol} {item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                        <p className="text-[0.6rem] uppercase text-muted-foreground">Valor original</p>
                        <p className="font-display font-bold tabular-nums">{formatBRL(item.lineBRL)}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                        <p className="text-[0.6rem] uppercase text-muted-foreground">Rateado</p>
                        <p className="font-display font-bold tabular-nums">{formatBRL(item.sharedBRL)}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                        <p className="text-[0.6rem] uppercase text-muted-foreground">Custo final</p>
                        <p className="font-display font-bold tabular-nums">{formatBRL(item.finalCostBRL)}</p>
                      </div>
                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-2.5">
                        <p className="text-[0.6rem] uppercase text-primary">Custo/unidade</p>
                        <p className="font-display font-bold text-primary tabular-nums">{formatBRL(item.unitCostBRL)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Timeline */}
        <aside>
          <h2 className="font-display text-lg font-semibold">Linha do tempo</h2>
          <div className="surface-card mt-3 rounded-2xl p-4">
            <ol className="relative space-y-4 border-l border-border pl-5">
              {importation.events.length === 0 && (
                <li className="text-sm text-muted-foreground">Sem eventos registrados.</li>
              )}
              {importation.events.map((event) => {
                const em = event.status ? statusMeta(event.status) : null;
                return (
                  <li key={event.id} className="relative">
                    <span className="absolute top-1 -left-[1.65rem] h-2.5 w-2.5 rounded-full bg-primary" />
                    <p className="text-sm font-medium">
                      {em ? `${em.emoji} ${em.label}` : event.note}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {em && event.note && event.note !== "Status alterado." ? `${event.note} · ` : ""}
                      {new Date(event.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}{" "}
                      {new Date(event.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>

          {importation.notes && (
            <div className="surface-card mt-4 rounded-2xl p-4">
              <p className="label-caps">Observações</p>
              <p className="mt-2 text-sm text-muted-foreground">{importation.notes}</p>
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir importação"
        description={
          importation.stockAdded
            ? "Esta importação já movimentou estoque. Em vez de apagar, ela será arquivada para preservar o histórico."
            : "Tem certeza que deseja excluir esta importação? Esta ação não pode ser desfeita."
        }
        confirmLabel={importation.stockAdded ? "Arquivar" : "Excluir"}
        onConfirm={() => void handleDelete()}
        onClose={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={confirmStock}
        title="Adicionar ao estoque"
        description={`Serão adicionadas ${calculation.totals.totalPieces} peça(s) ao estoque com custo médio ponderado. Esta ação só pode ser feita uma vez.`}
        confirmLabel="Confirmar entrada"
        onConfirm={() => void handleStock()}
        onClose={() => setConfirmStock(false)}
      />
    </div>
  );
}

export { isInProgress };
