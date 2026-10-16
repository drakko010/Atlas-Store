"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Ship } from "lucide-react";

import { createImportationFromCalculator } from "@/app/actions/importations";
import { listProducts } from "@/app/actions/products";
import type { Product } from "@/db/schema";
import { useToast } from "@/components/ui/toast";
import { formatBRL } from "@/lib/format";

export type CalculatorPayload = {
  method: "uscloser" | "cssbuy";
  currency: "USD" | "CNY";
  exchangeRate: number;
  productTotal: number;
  shipping: number;
  fees: number;
  insurance: number;
  taxesBRL: number;
  otherBRL: number;
  totalBRL: number;
  unitPrice: number;
};

export function SaveAsImportationDialog({
  open,
  onClose,
  payload,
}: {
  open: boolean;
  onClose: () => void;
  payload: CalculatorPayload | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setProductId("");
      setQuantity("1");
      void listProducts().then(setProducts);
    }
  }, [open]);

  if (!open || !payload) return null;

  const symbol = payload.currency === "USD" ? "US$" : "¥";

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome da importação.");
      return;
    }
    setSaving(true);
    const result = await createImportationFromCalculator({
      ...payload,
      name: name.trim(),
      productId: productId || null,
      quantity: Math.max(Number(quantity) || 1, 1),
      unitPrice: payload.unitPrice,
    });
    setSaving(false);

    if (result.ok) {
      toast.success("Importação criada a partir da calculadora!");
      onClose();
      router.push(`/imports/${result.id}`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Salvar como importação</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="surface-card rounded-xl p-3 text-sm">
            <p className="text-muted-foreground">
              {payload.method === "uscloser" ? "🇺🇸 US Closer" : "🇨🇳 CSSBuy"} · câmbio congelado{" "}
              <span className="font-semibold text-foreground">
                R$ {payload.exchangeRate.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
              </span>
            </p>
            <p className="mt-1 font-display text-xl font-bold text-primary tabular-nums">{formatBRL(payload.totalBRL)}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nome da importação *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Importação Nike Setembro"
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Vincular produto (opcional)</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
            >
              <option value="">Sem produto vinculado</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {productId && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
              <input
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
              />
              <p className="text-xs text-muted-foreground">
                Preço unitário: {symbol} {payload.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar importação"}
          </button>
        </div>
      </div>
    </div>
  );
}
