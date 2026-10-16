"use client";

import { useEffect, useState } from "react";
import { X, Camera } from "lucide-react";

import type { Product } from "@/db/schema";
import type { ProductFormData } from "@/app/actions/products";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Camiseta",
  "Dri-Fit",
  "Blusa",
  "Moletom",
  "Bermuda",
  "Calça",
  "Tênis",
  "Boné",
  "Jaqueta",
  "Velejador",
  "Outros",
];

const IMPORT_METHODS = [
  { value: "uscloser", label: "USCloser" },
  { value: "cssbuy", label: "CSSBuy" },
  { value: "direct", label: "Direto" },
  { value: "other", label: "Outro" },
];

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

export function ProductFormDialog({
  open,
  onClose,
  product,
  suppliers,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  suppliers: { id: string; name: string }[];
  onSave: (data: ProductFormData) => void;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [country, setCountry] = useState("");
  const [importMethod, setImportMethod] = useState<ProductFormData["importMethod"]>("uscloser");
  const [purchasePrice, setPurchasePrice] = useState("0,00");
  const [importCost, setImportCost] = useState("0,00");
  const [salePrice, setSalePrice] = useState("0,00");
  const [quantity, setQuantity] = useState("1");
  const [image, setImage] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setBrand(product.brand ?? "");
      setCategory(product.category ?? "");
      setSize(product.size ?? "");
      setColor(product.color ?? "");
      setSupplierId(product.supplierId ?? "");
      setCountry(product.country ?? "");
      setImportMethod(product.importMethod ?? "uscloser");
      setPurchasePrice(formatMoney(Number(product.purchasePrice)));
      setImportCost(formatMoney(Number(product.importCost)));
      setSalePrice(formatMoney(Number(product.salePrice)));
      setQuantity(String(product.quantity));
      setImage(product.image ?? "");
      setNotes(product.notes ?? "");
    } else {
      setName("");
      setBrand("");
      setCategory("");
      setSize("");
      setColor("");
      setSupplierId("");
      setCountry("");
      setImportMethod("uscloser");
      setPurchasePrice("0,00");
      setImportCost("0,00");
      setSalePrice("0,00");
      setQuantity("1");
      setImage("");
      setNotes("");
    }
  }, [product, open]);

  if (!open) return null;

  const totalCost = parseMoney(purchasePrice) + parseMoney(importCost);
  const costPerPiece = totalCost / (Number(quantity) || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      brand,
      category,
      size,
      color,
      supplierId: supplierId || null,
      country,
      importMethod,
      purchasePrice: parseMoney(purchasePrice),
      importCost: parseMoney(importCost),
      salePrice: parseMoney(salePrice),
      quantity: Number(quantity) || 1,
      image,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-semibold">
            {product ? "Editar produto" : "Novo produto"}
          </h2>
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
            {/* Imagem */}
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface">
                {image ? (
                  <img src={image} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Field label="URL da foto">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                  />
                </Field>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                />
              </Field>
              <Field label="Marca">
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                >
                  <option value="">Selecione...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Método de importação">
                <select
                  value={importMethod}
                  onChange={(e) => setImportMethod(e.target.value as ProductFormData["importMethod"])}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                >
                  {IMPORT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tamanho">
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                />
              </Field>
              <Field label="Cor">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                />
              </Field>
              <Field label="Quantidade">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fornecedor">
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                >
                  <option value="">Selecione...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="País de origem">
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                />
              </Field>
            </div>

            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-display text-sm font-semibold">Custos</h3>
              <p className="text-xs text-muted-foreground">
                O custo total considera produto + custos de importação rateados.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Custo do produto">
                  <div className="flex overflow-hidden rounded-xl border border-border bg-background">
                    <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full bg-transparent px-3 py-3 text-base outline-none"
                    />
                  </div>
                </Field>
                <Field label="Custo de importação">
                  <div className="flex overflow-hidden rounded-xl border border-border bg-background">
                    <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={importCost}
                      onChange={(e) => setImportCost(e.target.value)}
                      className="w-full bg-transparent px-3 py-3 text-base outline-none"
                    />
                  </div>
                </Field>
                <Field label="Preço de venda">
                  <div className="flex overflow-hidden rounded-xl border border-border bg-background">
                    <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="w-full bg-transparent px-3 py-3 text-base outline-none"
                    />
                  </div>
                </Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface/50 p-3">
                  <p className="text-xs text-muted-foreground">Custo total</p>
                  <p className="font-display text-lg font-bold tabular-nums">{formatMoney(totalCost)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface/50 p-3">
                  <p className="text-xs text-muted-foreground">Custo por peça</p>
                  <p className="font-display text-lg font-bold tabular-nums">{formatMoney(costPerPiece)}</p>
                </div>
              </div>
            </div>

            <Field label="Observações">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
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
              className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {product ? "Salvar alterações" : "Cadastrar produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
