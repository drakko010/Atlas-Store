"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Eye, Pencil, Plus, Search, Ship, Trash2, Package, Wallet, Layers } from "lucide-react";

import type { ImportationWithItems } from "@/app/actions/importations";
import {
  deleteImportation,
  duplicateImportation,
  getImportationsSummary,
  listImportations,
} from "@/app/actions/importations";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatBRL } from "@/lib/format";
import { isInProgress, statusMeta, STATUS_FLOW } from "@/features/importacoes/import-math";
import { cn } from "@/lib/utils";

type SortKey = "recent" | "oldest" | "costDesc" | "costAsc" | "qtyDesc" | "status";

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold whitespace-nowrap",
        status === "cancelled"
          ? "bg-destructive/10 text-destructive"
          : status === "received" || status === "completed"
            ? "bg-success/10 text-success"
            : "bg-primary/10 text-primary",
      )}
    >
      {meta.emoji} {meta.label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div className="surface-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} />
        <p className="label-caps">{label}</p>
      </div>
      <p className={cn("mt-2 font-display text-2xl font-bold tracking-tight tabular-nums", accent && "text-primary")}>
        {value}
      </p>
    </div>
  );
}

export function ImportsListPanel() {
  const toast = useToast();
  const [rows, setRows] = useState<ImportationWithItems[]>([]);
  const [summary, setSummary] = useState<{ total: number; inProgress: number; importedValue: number; importedPieces: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [confirmTarget, setConfirmTarget] = useState<ImportationWithItems | null>(null);

  const load = async () => {
    setIsLoading(true);
    const [r, s] = await Promise.all([listImportations(), getImportationsSummary()]);
    setRows(r);
    setSummary(s);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const brands = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.items.forEach((i) => i.brand && set.add(i.brand)));
    return [...set].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    const now = new Date();
    let list = rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (methodFilter !== "all" && r.method !== methodFilter) return false;
      if (currencyFilter !== "all" && r.currency !== currencyFilter) return false;
      if (brandFilter !== "all" && !r.items.some((i) => i.brand === brandFilter)) return false;
      if (periodFilter !== "all" && r.importDate) {
        const date = new Date(r.importDate);
        const days = periodFilter === "30" ? 30 : periodFilter === "90" ? 90 : null;
        if (days && (now.getTime() - date.getTime()) / 86400000 > days) return false;
        if (periodFilter === "year" && date.getFullYear() !== now.getFullYear()) return false;
      }
      if (term) {
        const haystack = [r.name, r.supplier ?? "", r.originCountry ?? "", ...r.items.map((i) => i.productName)]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    const pieces = (r: ImportationWithItems) => r.items.reduce((s, i) => s + i.quantity, 0);
    switch (sort) {
      case "recent":
        list = [...list].sort((a, b) => (b.importDate ?? "").localeCompare(a.importDate ?? ""));
        break;
      case "oldest":
        list = [...list].sort((a, b) => (a.importDate ?? "").localeCompare(b.importDate ?? ""));
        break;
      case "costDesc":
        list = [...list].sort((a, b) => Number(b.totalCost) - Number(a.totalCost));
        break;
      case "costAsc":
        list = [...list].sort((a, b) => Number(a.totalCost) - Number(b.totalCost));
        break;
      case "qtyDesc":
        list = [...list].sort((a, b) => pieces(b) - pieces(a));
        break;
      case "status":
        list = [...list].sort((a, b) => a.status.localeCompare(b.status));
        break;
    }
    return list;
  }, [rows, search, statusFilter, methodFilter, currencyFilter, periodFilter, brandFilter, sort]);

  const handleDuplicate = async (row: ImportationWithItems) => {
    const result = await duplicateImportation(row.id);
    if (result.ok) {
      toast.success("Importação duplicada como orçamento.");
      await load();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (row: ImportationWithItems) => {
    const result = await deleteImportation(row.id);
    if (result.ok) {
      toast.success(result.archived ? "Importação arquivada para preservar o histórico." : "Importação excluída.");
      await load();
    } else {
      toast.error(result.error);
    }
  };

  const selectClass = "surface-card rounded-xl px-3 py-2.5 text-sm outline-none";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Operação"
        title="Importações"
        description="Acompanhe cada importação do orçamento à entrada no estoque."
        action={
          <Link
            href="/imports/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:px-4 sm:py-2.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova importação</span>
            <span className="sm:hidden">Importação</span>
          </Link>
        }
      />

      {/* Resumo */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total de importações" value={String(summary?.total ?? 0)} icon={Ship} />
        <SummaryCard label="Em andamento" value={String(summary?.inProgress ?? 0)} icon={Layers} />
        <SummaryCard label="Valor importado" value={formatBRL(summary?.importedValue ?? 0)} icon={Wallet} accent />
        <SummaryCard label="Produtos importados" value={String(summary?.importedPieces ?? 0)} icon={Package} />
      </section>

      {/* Filtros */}
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="surface-card flex items-center gap-3 rounded-xl px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar importação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectClass}>
          <option value="recent">Mais recente</option>
          <option value="oldest">Mais antiga</option>
          <option value="costDesc">Maior custo</option>
          <option value="costAsc">Menor custo</option>
          <option value="qtyDesc">Maior quantidade</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="all">Todos os status</option>
          {STATUS_FLOW.map((s) => (
            <option key={s.key} value={s.key}>
              {s.emoji} {s.label}
            </option>
          ))}
          <option value="cancelled">❌ Cancelado</option>
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={selectClass}>
          <option value="all">Todos os métodos</option>
          <option value="uscloser">🇺 US Closer</option>
          <option value="cssbuy">🇨🇳 CSSBuy</option>
        </select>
        <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)} className={selectClass}>
          <option value="all">Todas as moedas</option>
          <option value="USD">USD</option>
          <option value="CNY">CNY</option>
        </select>
        <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className={selectClass}>
          <option value="all">Todo o período</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="year">Este ano</option>
        </select>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className={selectClass}>
          <option value="all">Todas as marcas</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="surface-card h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <section className="surface-card mt-6 rounded-2xl p-6 text-center sm:p-10">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary">
            <Ship className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nenhuma importação encontrada.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Comece calculando sua primeira importação e acompanhe tudo por aqui.
          </p>
          <Link
            href="/imports/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nova importação
          </Link>
        </section>
      ) : (
        <>
          {/* Desktop: tabela */}
          <div className="surface-card mt-6 hidden overflow-hidden rounded-2xl md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Importação</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Produtos</th>
                  <th className="px-4 py-3 font-medium">Qtd.</th>
                  <th className="px-4 py-3 font-medium">Custo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const pieces = row.items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <tr key={row.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-surface/50">
                      <td className="px-4 py-3">
                        <Link href={`/imports/${row.id}`} className="font-display font-semibold hover:text-primary">
                          {row.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.method === "uscloser" ? "🇺🇸 US Closer" : "🇨🇳 CSSBuy"}</td>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                        {row.importDate ? new Date(`${row.importDate}T12:00:00`).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{row.items.length}</td>
                      <td className="px-4 py-3 tabular-nums">{pieces}</td>
                      <td className="px-4 py-3 font-medium tabular-nums">{formatBRL(Number(row.totalCost))}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/imports/${row.id}`} data-tooltip="Visualizar" className="tooltip rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground" aria-label="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link href={`/imports/${row.id}/editar`} data-tooltip="Editar" className="tooltip rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground" aria-label="Editar">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button type="button" onClick={() => void handleDuplicate(row)} data-tooltip="Duplicar" className="tooltip rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground" aria-label="Duplicar">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setConfirmTarget(row)} data-tooltip="Excluir" className="tooltip rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="mt-6 space-y-3 md:hidden">
            {filtered.map((row) => {
              const pieces = row.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <Link key={row.id} href={`/imports/${row.id}`} className="surface-card block rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold">{row.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.method === "uscloser" ? "🇺🇸 US Closer" : "🇨🇳 CSSBuy"} ·{" "}
                        {row.importDate ? new Date(`${row.importDate}T12:00:00`).toLocaleDateString("pt-BR") : "—"}
                      </p>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[0.6rem] uppercase text-muted-foreground">Produtos</p>
                      <p className="font-medium tabular-nums">
                        {row.items.length} · {pieces} pç
                      </p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="text-[0.6rem] uppercase text-muted-foreground">Custo</p>
                      <p className="font-display font-bold text-primary tabular-nums">{formatBRL(Number(row.totalCost))}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-2">
                    <span onClick={(e) => e.preventDefault()} className="contents">
                      <Link href={`/imports/${row.id}/editar`} className="rounded-lg p-2 text-muted-foreground" aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          void handleDuplicate(row);
                        }}
                        className="rounded-lg p-2 text-muted-foreground"
                        aria-label="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setConfirmTarget(row);
                        }}
                        className="rounded-lg p-2 text-muted-foreground"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Excluir importação"
        description={
          confirmTarget?.stockAdded
            ? "Esta importação já movimentou estoque. Em vez de apagar, ela será arquivada para preservar o histórico."
            : `Tem certeza que deseja excluir "${confirmTarget?.name ?? ""}"? Esta ação não pode ser desfeita.`
        }
        confirmLabel={confirmTarget?.stockAdded ? "Arquivar" : "Excluir"}
        onConfirm={() => confirmTarget && void handleDelete(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}

export { isInProgress };
