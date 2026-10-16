"use client";

import { X } from "lucide-react";

import type { HistoryRecord } from "@/app/actions/history";
import { formatBRL, formatNumber, formatPercent } from "@/lib/format";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function HistoryDetailDialog({
  record,
  onClose,
  onDelete,
}: {
  record: HistoryRecord | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  if (!record) return null;

  const dateLabel = new Date(record.date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Detalhes do registro</h2>
            <p className="text-xs text-muted-foreground">{dateLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
          <div className="mb-4">
            <span
              className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${
                record.type === "sale"
                  ? "bg-success/10 text-success"
                  : record.type === "importation"
                    ? "bg-primary/10 text-primary"
                    : record.type === "expense"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {record.type === "importation"
                ? "Importação"
                : record.type === "sale"
                  ? "Venda"
                  : record.type === "expense"
                    ? "Despesa"
                    : "Meta"}
            </span>
            <p className="mt-2 text-sm text-muted-foreground">{record.description}</p>
          </div>

          <div className="surface-card rounded-2xl p-4">
            <Row label="Valor" value={formatBRL(record.value)} />
            {record.method && <Row label="Método" value={record.method} />}
            {record.status && <Row label="Status" value={record.status} />}

            {record.type === "importation" && (
              <>
                <Row label="Fornecedor" value={record.details.supplier ?? "—"} />
                <Row label="País de origem" value={record.details.originCountry ?? "—"} />
                <Row label="Moeda" value={record.details.currency} />
                <Row label="Cotação" value={formatBRL(record.details.exchangeRate)} />
                <Row label="Total produtos" value={formatBRL(record.details.productTotal)} />
                <Row label="Frete" value={formatBRL(record.details.shippingCost)} />
                <Row label="Impostos" value={formatBRL(record.details.taxes)} />
                <Row label="Taxas" value={formatBRL(record.details.fees)} />
                <Row label="Seguro" value={formatBRL(record.details.insurance)} />
                <Row label="Custo total" value={formatBRL(record.details.totalCost)} />
                {record.details.notes && <Row label="Observações" value={record.details.notes} />}
              </>
            )}

            {record.type === "sale" && (
              <>
                <Row label="Produto" value={record.details.productName} />
                <Row label="Quantidade" value={String(record.details.quantity)} />
                <Row label="Preço de venda" value={formatBRL(record.details.salePrice)} />
                <Row label="Receita total" value={formatBRL(record.details.totalRevenue)} />
                <Row label="Custo total" value={formatBRL(record.details.totalCost)} />
                <Row label="Taxa de pagamento" value={formatBRL(record.details.paymentFee)} />
                <Row label="Outros custos" value={formatBRL(record.details.otherCosts)} />
                <Row label="Lucro bruto" value={formatBRL(record.details.grossProfit)} />
                <Row label="Disponível" value={formatBRL(record.details.availableProfit)} />
                <Row label="Reinvestimento" value={formatBRL(record.details.reinvestmentProfit)} />
                {record.details.notes && <Row label="Observações" value={record.details.notes} />}
              </>
            )}

            {record.type === "expense" && (
              <>
                <Row label="Categoria" value={record.details.category} />
                <Row label="Valor" value={formatBRL(record.details.amount)} />
                {record.details.notes && <Row label="Observações" value={record.details.notes} />}
              </>
            )}

            {record.type === "goal" && (
              <>
                <Row label="Valor da meta" value={formatBRL(record.details.targetAmount)} />
                <Row label="Alcançado" value={formatBRL(record.details.currentAmount)} />
                <Row label="Preço de venda" value={formatBRL(record.details.salePrice)} />
                <Row label="Custo unitário" value={formatBRL(record.details.unitCost)} />
                <Row label="Lucro disponível / peça" value={formatBRL(record.details.profitPerPiece)} />
                <Row label="Peças necessárias" value={String(record.details.piecesNeeded)} />
                <Row
                  label="Prazo"
                  value={record.details.deadline ? new Date(record.details.deadline).toLocaleDateString("pt-BR") : "—"}
                />
              </>
            )}
          </div>
        </div>

        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={onDelete}
            className="w-full rounded-xl border border-destructive/50 bg-destructive/10 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20"
          >
            Excluir registro
          </button>
        </div>
      </div>
    </div>
  );
}
