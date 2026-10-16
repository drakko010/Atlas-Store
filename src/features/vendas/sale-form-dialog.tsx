"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import type { Sale } from "@/db/schema";
import type { SaleFormData } from "@/app/actions/sales";
import { calculateSale } from "@/features/vendas/sale-math";
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

export function SaleFormDialog({
  open,
  onClose,
  products,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  products: { id: string; name: string; totalCost: string; unitCost: string; salePrice: string; quantity: number }[];
  onSave: (data: SaleFormData) => void;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [salePrice, setSalePrice] = useState("0,00");
  const [paymentFee, setPaymentFee] = useState("0,00");
  const [otherCosts, setOtherCosts] = useState("0,00");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [split, setSplit] = useState({ available: 50, reinvestment: 50 });

  const selectedProduct = products.find((p) => p.id === productId);

  const preview = useMemo(() => {
    const unitCost = selectedProduct
      ? Number(selectedProduct.unitCost) > 0
        ? Number(selectedProduct.unitCost)
        : Number(selectedProduct.totalCost) / Math.max(selectedProduct.quantity, 1)
      : 0;
    return calculateSale(
      {
        salePrice: parseMoney(salePrice),
        quantity: Number(quantity) || 1,
        unitCost,
        paymentFee: parseMoney(paymentFee),
        otherCosts: parseMoney(otherCosts),
      },
      { availablePercentage: split.available, reinvestmentPercentage: split.reinvestment },
    );
  }, [salePrice, quantity, selectedProduct, paymentFee, otherCosts, split]);

  useEffect(() => {
    if (selectedProduct && parseMoney(salePrice) === 0) {
      setSalePrice(formatMoney(Number(selectedProduct.salePrice)));
    }
  }, [selectedProduct]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    onSave({
      productId,
      quantity: Number(quantity) || 1,
      salePrice: parseMoney(salePrice),
      paymentFee: parseMoney(paymentFee),
      otherCosts: parseMoney(otherCosts),
      saleDate,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-semibold">Nova venda</h2>
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
            <Field label="Produto" required>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
              >
                <option value="">Selecione um produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (estoque: {p.quantity})
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantidade" required>
                <input
                  type="number"
                  min={1}
                  max={selectedProduct?.quantity ?? undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                />
              </Field>
              <Field label="Data da venda" required>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                />
              </Field>
            </div>

            <Field label="Preço de venda" required>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Taxa de pagamento">
                <div className="flex overflow-hidden rounded-xl border border-border bg-background">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={paymentFee}
                    onChange={(e) => setPaymentFee(e.target.value)}
                    className="w-full bg-transparent px-3 py-3 text-base outline-none"
                  />
                </div>
              </Field>
              <Field label="Outros custos">
                <div className="flex overflow-hidden rounded-xl border border-border bg-background">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(e.target.value)}
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

            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-display text-sm font-semibold">Resumo da venda</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preço de venda</span>
                  <span className="font-medium">{formatBRL(preview.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Custo</span>
                  <span className="font-medium">{formatBRL(preview.totalCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Lucro</span>
                  <span
                    className={`font-display font-bold ${preview.isLoss ? "text-destructive" : "text-success"}`}
                  >
                    {preview.isLoss ? "⚠️ PREJUÍZO" : formatBRL(preview.grossProfit)}
                  </span>
                </div>
                {!preview.isLoss && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Disponível</span>
                      <span className="font-medium">{formatBRL(preview.availableProfit)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reinvestimento</span>
                      <span className="font-medium">{formatBRL(preview.reinvestmentProfit)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Field label="Observações">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
              />
            </Field>
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
              disabled={!productId}
              className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Registrar venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
