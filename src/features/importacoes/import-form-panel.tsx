"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Ship, Trash2, Boxes, AlertCircle } from "lucide-react";

import type { ImportationWithItems } from "@/app/actions/importations";
import {
  createImportation,
  updateImportation,
  type ImportationFormData,
} from "@/app/actions/importations";
import { getFullSettings } from "@/app/actions/settings";
import { listProducts } from "@/app/actions/products";
import { createProduct, type ProductFormData } from "@/app/actions/products";
import type { Product } from "@/db/schema";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/toast";
import { ProductFormDialog } from "@/features/produtos/product-form-dialog";
import { listSuppliers } from "@/app/actions/suppliers";
import { formatBRL, parseDecimalInput } from "@/lib/format";
import {
  calculateImportation,
  STATUS_FLOW,
  type ImportItemInput,
} from "@/features/importacoes/import-math";
import { cn } from "@/lib/utils";

type ItemRow = {
  key: number;
  productId: string;
  quantity: string;
  unitPrice: string;
  unitWeight: string;
};

let rowKey = 0;

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

export function ImportFormPanel({ existing }: { existing?: ImportationWithItems | null }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(existing?.name ?? "");
  const [method, setMethod] = useState<"uscloser" | "cssbuy">(existing?.method === "cssbuy" ? "cssbuy" : "uscloser");
  const [supplier, setSupplier] = useState(existing?.supplier ?? "");
  const [importDate, setImportDate] = useState(
    existing?.importDate ?? new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState<string>(existing?.status ?? "budget");
  const [rateTouched, setRateTouched] = useState(Boolean(existing));
  const [rate, setRate] = useState(existing?.exchangeRate ?? "5,00");
  const [shipping, setShipping] = useState(existing ? String(Number(existing.shippingCost)).replace(".", ",") : "0,00");
  const [fees, setFees] = useState(existing ? String(Number(existing.fees)).replace(".", ",") : "0,00");
  const [insurance, setInsurance] = useState(existing ? String(Number(existing.insurance)).replace(".", ",") : "0,00");
  const [taxes, setTaxes] = useState(existing ? String(Number(existing.taxes)).replace(".", ",") : "0,00");
  const [other, setOther] = useState(existing ? String(Number(existing.otherCosts)).replace(".", ",") : "0,00");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [items, setItems] = useState<ItemRow[]>(
    existing?.items.map((i) => ({
      key: ++rowKey,
      productId: i.productId,
      quantity: String(i.quantity),
      unitPrice: String(Number(i.unitPrice)).replace(".", ","),
      unitWeight: String(Number(i.unitWeight)).replace(".", ","),
    })) ?? [],
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currency = method === "uscloser" ? "USD" : "CNY";
  const symbol = currency === "USD" ? "US$" : "¥";
  const origin = method === "uscloser" ? "Estados Unidos" : "China";

  useEffect(() => {
    Promise.all([listProducts(), listSuppliers()]).then(([p, s]) => {
      setProducts(p);
      setSuppliers(s);
    });
  }, [productDialogOpen]);

  useEffect(() => {
    if (existing) return;
    if (rateTouched) return;
    getFullSettings().then((s) => {
      setRate(
        (method === "uscloser" ? s.usdRate : s.cnyRate).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        }),
      );
    });
  }, [method, existing, rateTouched]);

  const parsedItems: ImportItemInput[] = useMemo(
    () =>
      items
        .filter((i) => i.productId)
        .map((i) => ({
          productId: i.productId,
          quantity: Math.max(Math.floor(Number(i.quantity)) || 0, 0),
          unitPrice: parseDecimalInput(i.unitPrice),
          unitWeight: parseDecimalInput(i.unitWeight),
        })),
    [items],
  );

  const calculation = useMemo(
    () =>
      calculateImportation(parsedItems, {
        exchangeRate: parseDecimalInput(rate) || 0,
        shipping: parseDecimalInput(shipping),
        fees: parseDecimalInput(fees),
        insurance: parseDecimalInput(insurance),
        taxesBRL: parseDecimalInput(taxes),
        otherBRL: parseDecimalInput(other),
      }),
    [parsedItems, rate, shipping, fees, insurance, taxes, other],
  );

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "—";

  const updateItem = (key: number, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError("Informe o nome da importação.");
    if (!(parseDecimalInput(rate) > 0)) return setError("A cotação deve ser maior que zero.");
    if (parsedItems.length === 0) return setError("Adicione pelo menos um produto à importação.");
    if (parsedItems.some((i) => !(i.quantity > 0))) return setError("Toda quantidade deve ser maior que zero.");

    const data: ImportationFormData = {
      name: name.trim(),
      method,
      supplier,
      originCountry: origin,
      currency,
      exchangeRate: parseDecimalInput(rate),
      importDate,
      status: status as ImportationFormData["status"],
      shipping: parseDecimalInput(shipping),
      fees: parseDecimalInput(fees),
      insurance: parseDecimalInput(insurance),
      taxesBRL: parseDecimalInput(taxes),
      otherBRL: parseDecimalInput(other),
      notes,
      items: parsedItems,
    };

    setSaving(true);
    const result = existing
      ? await updateImportation(existing.id, data)
      : await createImportation(data);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(existing ? "Importação atualizada!" : "Importação criada com sucesso!");
    router.push(`/imports/${existing ? existing.id : "id" in result ? result.id : ""}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Operação"
        title={existing ? "Editar importação" : "Nova importação"}
        description="Monte a importação do orçamento ao custo final. O câmbio fica congelado nesta importação."
      />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Formulário */}
        <section className="space-y-4">
          {/* Informações gerais */}
          <div className="surface-card rounded-2xl p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold">Informações gerais</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Nome da importação" required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Importação Nike Setembro"
                    className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                  />
                </Field>
              </div>

              <Field label="Método" required>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("uscloser")}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                      method === "uscloser"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-muted-foreground hover:bg-muted",
                    )}
                  >
                    🇺🇸 US Closer
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("cssbuy")}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                      method === "cssbuy"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-muted-foreground hover:bg-muted",
                    )}
                  >
                    🇨🇳 CSSBuy
                  </button>
                </div>
              </Field>

              <Field label="Origem → Destino">
                <div className="rounded-xl border border-border bg-surface/50 px-3 py-3 text-sm font-medium">
                  {origin} → Brasil
                </div>
              </Field>

              <Field label={`Cotação utilizada (${currency})`} required>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rate}
                    onChange={(e) => {
                      setRate(e.target.value);
                      setRateTouched(true);
                    }}
                    className="w-full bg-transparent px-3 py-3 text-base outline-none"
                  />
                </div>
              </Field>

              <Field label="Data da importação">
                <input
                  type="date"
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                />
              </Field>

              <Field label="Fornecedor">
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                />
              </Field>

              <Field label="Status inicial">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-base outline-none"
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.emoji} {s.label}
                    </option>
                  ))}
                  <option value="cancelled">❌ Cancelado</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Produtos */}
          <div className="surface-card rounded-2xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Produtos</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProductDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                  Novo produto
                </button>
                <button
                  type="button"
                  onClick={() => setItems((prev) => [...prev, { key: ++rowKey, productId: "", quantity: "1", unitPrice: "0,00", unitWeight: "0,00" }])}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar produto
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border bg-surface/50 p-4 text-sm text-muted-foreground">
                Nenhum produto adicionado ainda. Use “Adicionar produto” para selecionar um produto
                cadastrado ou “Novo produto” para criar um agora.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item.key} className="rounded-xl border border-border bg-surface/40 p-3">
                    <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(item.key, { productId: e.target.value })}
                        className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
                      >
                        <option value="">Selecione o produto...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                            {p.brand ? ` · ${p.brand}` : ""}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                        placeholder="Qtd."
                        className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })}
                        placeholder={`Preço (${symbol})`}
                        className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.unitWeight}
                        onChange={(e) => updateItem(item.key, { unitWeight: e.target.value })}
                        placeholder="Peso (kg)"
                        className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                        className="tooltip self-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        data-tooltip="Remover"
                        aria-label="Remover produto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {productName(item.productId)} · Total:{" "}
                      <span className="font-semibold text-foreground">
                        {symbol}{" "}
                        {(parseDecimalInput(item.unitPrice) * (Number(item.quantity) || 0)).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Resumo dos produtos */}
            {parsedItems.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">Produto</th>
                      <th className="py-2 pr-2 font-medium">Qtd.</th>
                      <th className="py-2 pr-2 font-medium">Preço</th>
                      <th className="py-2 pr-2 font-medium">Peso</th>
                      <th className="py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.items.map((item) => (
                      <tr key={item.productId} className="border-b border-border/50">
                        <td className="py-2 pr-2">{productName(item.productId)}</td>
                        <td className="py-2 pr-2 tabular-nums">{item.quantity}</td>
                        <td className="py-2 pr-2 tabular-nums">
                          {symbol} {item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 pr-2 tabular-nums">{item.unitWeight.toLocaleString("pt-BR")} kg</td>
                        <td className="py-2 font-medium tabular-nums">
                          {symbol} {item.lineForeign.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 pr-2 font-semibold" colSpan={4}>
                        Total
                      </td>
                      <td className="py-2 font-display font-bold tabular-nums">
                        {symbol} {calculation.totals.productForeign.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Custos */}
          <div className="surface-card rounded-2xl p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold">💰 Custos</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Frete, taxas e seguro em {currency}. Impostos e outros custos em BRL.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label={`Frete (${symbol})`}>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">{symbol}</span>
                  <input type="text" inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} className="w-full bg-transparent px-3 py-3 text-base outline-none" />
                </div>
              </Field>
              <Field label={`Taxas (${symbol})`}>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">{symbol}</span>
                  <input type="text" inputMode="decimal" value={fees} onChange={(e) => setFees(e.target.value)} className="w-full bg-transparent px-3 py-3 text-base outline-none" />
                </div>
              </Field>
              <Field label={`Seguro (${symbol})`}>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">{symbol}</span>
                  <input type="text" inputMode="decimal" value={insurance} onChange={(e) => setInsurance(e.target.value)} className="w-full bg-transparent px-3 py-3 text-base outline-none" />
                </div>
              </Field>
              <Field label="Impostos (R$)">
                <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">R$</span>
                  <input type="text" inputMode="decimal" value={taxes} onChange={(e) => setTaxes(e.target.value)} className="w-full bg-transparent px-3 py-3 text-base outline-none" />
                </div>
              </Field>
              <Field label="Outros custos (R$)">
                <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background">
                  <span className="flex items-center border-r border-border bg-surface px-3 text-sm text-muted-foreground">R$</span>
                  <input type="text" inputMode="decimal" value={other} onChange={(e) => setOther(e.target.value)} className="w-full bg-transparent px-3 py-3 text-base outline-none" />
                </div>
              </Field>
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
        </section>

        {/* Resumo */}
        <aside className="space-y-4">
          <div className="surface-card glow-primary rounded-2xl p-5">
            <p className="label-caps">Custo total da importação</p>
            <p className="mt-2 font-display text-3xl font-bold tracking-tight text-primary tabular-nums">
              {formatBRL(calculation.totals.totalBRL)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {calculation.totals.totalPieces} peça(s) · custo médio {formatBRL(calculation.totals.averageCostPerPiece)}/peça
            </p>
          </div>

          <div className="surface-card rounded-2xl p-4">
            <h3 className="font-display text-sm font-semibold">Como o custo foi formado</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex justify-between">
                <span>Produtos</span>
                <span className="font-medium text-foreground">
                  {symbol} {calculation.totals.productForeign.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ={" "}
                  {formatBRL(calculation.totals.productBRL)}
                </span>
              </li>
              <li className="flex justify-between">
                <span>Frete</span>
                <span className="font-medium text-foreground">{formatBRL(calculation.totals.shippingBRL)}</span>
              </li>
              <li className="flex justify-between">
                <span>Taxas</span>
                <span className="font-medium text-foreground">{formatBRL(calculation.totals.feesBRL)}</span>
              </li>
              <li className="flex justify-between">
                <span>Seguro</span>
                <span className="font-medium text-foreground">{formatBRL(calculation.totals.insuranceBRL)}</span>
              </li>
              <li className="flex justify-between">
                <span>Impostos</span>
                <span className="font-medium text-foreground">{formatBRL(calculation.totals.taxesBRL)}</span>
              </li>
              <li className="flex justify-between">
                <span>Outros</span>
                <span className="font-medium text-foreground">{formatBRL(calculation.totals.otherBRL)}</span>
              </li>
              <li className="flex justify-between border-t border-border pt-2 font-display text-base font-semibold text-foreground">
                <span>Total</span>
                <span className="text-primary">{formatBRL(calculation.totals.totalBRL)}</span>
              </li>
            </ul>
          </div>

          {calculation.items.length > 0 && (
            <div className="surface-card rounded-2xl p-4">
              <h3 className="font-display text-sm font-semibold">Custo real por produto</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Frete, taxas e impostos rateados pelo valor dos produtos.
              </p>
              <div className="mt-3 space-y-3">
                {calculation.items.map((item) => (
                  <div key={item.productId} className="rounded-xl border border-border bg-surface/50 p-3 text-sm">
                    <p className="font-medium">{productName(item.productId)}</p>
                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                      <p className="flex justify-between">
                        <span>Valor original</span>
                        <span className="text-foreground">{formatBRL(item.lineBRL)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Custos rateados</span>
                        <span className="text-foreground">{formatBRL(item.sharedBRL)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Custo final ({item.quantity} un.)</span>
                        <span className="text-foreground">{formatBRL(item.finalCostBRL)}</span>
                      </p>
                      <p className="flex justify-between border-t border-border pt-1 font-semibold text-primary">
                        <span>Custo por unidade</span>
                        <span>{formatBRL(item.unitCostBRL)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : existing ? "Salvar alterações" : "Salvar importação"}
          </button>
        </aside>
      </div>

      <ProductFormDialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        product={null}
        suppliers={suppliers}
        onSave={async (data: ProductFormData) => {
          try {
            const created = await createProduct(data);
            setProducts((prev) => [...prev, created]);
            setItems((prev) => {
              const empty = prev.find((i) => !i.productId);
              if (empty) {
                return prev.map((i) => (i.key === empty.key ? { ...i, productId: created.id } : i));
              }
              return [...prev, { key: ++rowKey, productId: created.id, quantity: "1", unitPrice: "0,00", unitWeight: "0,00" }];
            });
            setProductDialogOpen(false);
            toast.success("Produto criado e adicionado à importação!");
          } catch {
            toast.error("Não foi possível criar o produto.");
          }
        }}
      />
    </div>
  );
}
