"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, ShoppingBag, Trash2 } from "lucide-react";

import type { Sale } from "@/db/schema";
import { PageHeader } from "@/components/layout/page-header";
import { formatBRL } from "@/lib/format";
import { listProductsForSale, listSales, createSale, deleteSale, type SaleFormData } from "@/app/actions/sales";
import { SaleFormDialog } from "@/features/vendas/sale-form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export function SalesPanel() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<
    { id: string; name: string; totalCost: string; unitCost: string; salePrice: string; quantity: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Sale | null>(null);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    const [s, p] = await Promise.all([listSales(), listProductsForSale()]);
    setSales(s);
    setProducts(p);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredSales = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return sales;
    return sales.filter((sale) => {
      const product = products.find((p) => p.id === sale.productId);
      return product?.name.toLowerCase().includes(term);
    });
  }, [sales, search, products]);

  const totals = useMemo(() => {
    return sales.reduce(
      (acc, sale) => ({
        revenue: acc.revenue + Number(sale.totalRevenue),
        profit: acc.profit + Number(sale.grossProfit),
        available: acc.available + Number(sale.availableProfit),
        reinvestment: acc.reinvestment + Number(sale.reinvestmentProfit),
        pieces: acc.pieces + sale.quantity,
      }),
      { revenue: 0, profit: 0, available: 0, reinvestment: 0, pieces: 0 },
    );
  }, [sales]);

  const handleSave = async (data: SaleFormData) => {
    try {
      await createSale(data);
      toast.success("Venda registrada com sucesso!");
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível registrar a venda.");
    }
  };

  const handleDelete = async (sale: Sale) => {
    try {
      await deleteSale(sale.id);
      toast.success("Venda excluída. Estoque e meta recalculados.");
      await load();
    } catch {
      toast.error("Não foi possível excluir a venda.");
    }
  };

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "Produto";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Financeiro"
        title="Vendas"
        description="Cada venda com receita, custo real, lucro e a divisão entre disponível e reinvestimento."
        action={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:px-4 sm:py-2.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova venda</span>
            <span className="sm:hidden">Venda</span>
          </button>
        }
      />

      {/* Cards de totais */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <p className="label-caps">Faturamento</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">{formatBRL(totals.revenue)}</p>
        </div>
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <p className="label-caps">Lucro</p>
          <p
            className={`mt-2 font-display text-2xl font-bold tabular-nums ${totals.profit >= 0 ? "text-primary" : "text-destructive"}`}
          >
            {formatBRL(totals.profit)}
          </p>
        </div>
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <p className="label-caps">Disponível</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">{formatBRL(totals.available)}</p>
        </div>
        <div className="surface-card rounded-2xl p-4 sm:p-5">
          <p className="label-caps">Reinvestimento</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums">{formatBRL(totals.reinvestment)}</p>
        </div>
      </section>

      <p className="mt-4 text-sm text-muted-foreground">
        {totals.pieces} peça(s) vendida(s). Faturamento não é lucro — o lucro já desconta custo real, taxa de
        pagamento e outros custos.
      </p>

      {/* Busca */}
      <div className="mt-6 grid gap-3">
        <div className="surface-card flex items-center gap-3 rounded-xl px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por produto, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface-card h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredSales.length === 0 ? (
        <section className="surface-card mt-6 rounded-2xl p-6 text-center sm:p-10">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nenhuma venda registrada ainda.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Lançe suas vendas para acompanhar faturamento, lucro e divisão entre disponível e
            reinvestimento.
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nova venda
          </button>
        </section>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredSales.map((sale) => {
            const isLoss = Number(sale.grossProfit) < 0;
            return (
              <article
                key={sale.id}
                className="surface-card rounded-2xl p-4 transition-colors sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-semibold">{productName(sale.productId)}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.quantity} un. · {new Date(sale.saleDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmTarget(sale)}
                    data-tooltip="Excluir venda"
                    className="tooltip rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Excluir venda"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-5">
                  <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                    <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Venda</p>
                    <p className="font-display text-sm font-bold tabular-nums">
                      {formatBRL(Number(sale.salePrice))}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                    <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Custo</p>
                    <p className="font-display text-sm font-bold tabular-nums">
                      {formatBRL(Number(sale.totalCost))}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                    <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Lucro</p>
                    <p
                      className={`font-display text-sm font-bold tabular-nums ${isLoss ? "text-destructive" : "text-success"}`}
                    >
                      {isLoss ? `⚠️ PREJUÍZO ${formatBRL(Number(sale.grossProfit))}` : formatBRL(Number(sale.grossProfit))}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                    <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Disponível</p>
                    <p className="font-display text-sm font-bold tabular-nums text-primary">
                      {formatBRL(Number(sale.availableProfit))}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/50 p-2.5">
                    <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">Reinvest.</p>
                    <p className="font-display text-sm font-bold tabular-nums">
                      {formatBRL(Number(sale.reinvestmentProfit))}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <SaleFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        products={products}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Excluir venda"
        description="O estoque do produto será devolvido e o progresso da meta recalculado. Continuar?"
        confirmLabel="Excluir"
        onConfirm={() => confirmTarget && void handleDelete(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}
