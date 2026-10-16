"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Search, Trash2, Pencil, Camera } from "lucide-react";

import type { Product } from "@/db/schema";
import { PageHeader } from "@/components/layout/page-header";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listProducts, createProduct, updateProduct, deleteProduct, type ProductFormData } from "@/app/actions/products";
import { listSuppliers } from "@/app/actions/suppliers";
import { ProductFormDialog } from "@/features/produtos/product-form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

const CATEGORIES = [
  "Todas",
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

function unitCostOf(p: Product): number {
  return Number(p.unitCost) > 0
    ? Number(p.unitCost)
    : Number(p.totalCost) / Math.max(p.quantity, 1);
}

export function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Product | null>(null);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    const [p, s] = await Promise.all([listProducts(), listSuppliers()]);
    setProducts(p);
    setSuppliers(s);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.brand ?? "").toLowerCase().includes(term) ||
        (p.color ?? "").toLowerCase().includes(term);
      const matchesCategory = category === "Todas" || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const totals = useMemo(() => {
    const unitCostOf = (p: Product) =>
      Number(p.unitCost) > 0 ? Number(p.unitCost) : Number(p.totalCost) / Math.max(p.quantity, 1);
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalCost = products.reduce((sum, p) => sum + p.quantity * unitCostOf(p), 0);
    const potentialRevenue = products.reduce(
      (sum, p) => sum + p.quantity * Number(p.salePrice),
      0,
    );
    return { totalQuantity, totalCost, potentialRevenue };
  }, [products]);

  const handleSave = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await createProduct(data);
        toast.success("Produto cadastrado com sucesso!");
      }
      setDialogOpen(false);
      setEditingProduct(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o produto.");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      toast.success(`Produto "${product.name}" excluído.`);
      await load();
    } catch {
      toast.error("Não foi possível excluir o produto.");
    }
  };

  const supplierName = (id: string | null) =>
    suppliers.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Operação"
        title="Produtos"
        description="Catálogo com custo real por peça, preço de venda e margem."
        action={
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setDialogOpen(true);
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:px-4 sm:py-2.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo produto</span>
            <span className="sm:hidden">Produto</span>
          </button>
        }
      />

      {/* Cards de totais */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <p className="label-caps">Peças em estoque</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">{totals.totalQuantity}</p>
        </div>
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <p className="label-caps">Custo real do estoque</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">{formatBRL(totals.totalCost)}</p>
        </div>
        <div className="surface-card glow-primary rounded-2xl p-4 sm:p-5">
          <p className="label-caps">Receita potencial</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-primary">
            {formatBRL(totals.potentialRevenue)}
          </p>
        </div>
      </section>

      {/* Filtros */}
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="surface-card flex items-center gap-3 rounded-xl px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, marca, cor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="surface-card rounded-xl px-4 py-3 text-sm outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-card h-48 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <section className="surface-card mt-6 rounded-2xl p-6 text-center sm:p-10">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary">
            <Package className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nenhum produto encontrado.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Cadastre seus produtos para acompanhar estoque, custo real e receita potencial.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setDialogOpen(true);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </button>
        </section>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="surface-card group relative overflow-hidden rounded-2xl p-4 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-base font-semibold">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {product.brand} · {product.category} · {product.color}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product.quantity} un. · {product.size} · {supplierName(product.supplierId)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                  <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Custo em estoque</p>
                  <p className="font-display text-sm font-bold tabular-nums">
                    {formatBRL(unitCostOf(product) * product.quantity)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                  <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Custo / peça</p>
                  <p className="font-display text-sm font-bold tabular-nums">
                    {formatBRL(unitCostOf(product))}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                  <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Preço venda</p>
                  <p className="font-display text-sm font-bold tabular-nums text-primary">
                    {formatBRL(Number(product.salePrice))}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                  <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Margem</p>
                  <p className="font-display text-sm font-bold tabular-nums text-success">
                    {formatBRL(Number(product.salePrice) - unitCostOf(product))}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(product)}
                  data-tooltip="Editar produto"
                  className="tooltip rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmTarget(product)}
                  data-tooltip="Excluir produto"
                  className="tooltip rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        suppliers={suppliers}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Excluir produto"
        description={`Tem certeza que deseja excluir "${confirmTarget?.name ?? ""}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => confirmTarget && void handleDelete(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}
