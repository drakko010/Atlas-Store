"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Search, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getHistory, deleteHistoryRecord, type HistoryRecord, type HistoryType } from "@/app/actions/history";
import { HistoryDetailDialog } from "@/features/historico/history-detail-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

const TABS: { value: HistoryType | "all"; label: string }[] = [
  { value: "all", label: "Tudo" },
  { value: "importation", label: "Importações" },
  { value: "sale", label: "Vendas" },
  { value: "expense", label: "Despesas" },
  { value: "goal", label: "Metas" },
];

function typeLabel(type: HistoryType): string {
  switch (type) {
    case "importation":
      return "Importação";
    case "sale":
      return "Venda";
    case "expense":
      return "Despesa";
    case "goal":
      return "Meta";
  }
}

function typeBadge(type: HistoryType): string {
  switch (type) {
    case "importation":
      return "bg-primary/10 text-primary";
    case "sale":
      return "bg-success/10 text-success";
    case "expense":
      return "bg-destructive/10 text-destructive";
    case "goal":
      return "bg-muted text-muted-foreground";
  }
}

export function HistoryPanel() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<HistoryType | "all">("all");
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<HistoryRecord | null>(null);
  const toast = useToast();

  const load = async () => {
    setIsLoading(true);
    const data = await getHistory();
    setRecords(data);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRecords = useMemo(() => {
    const term = search.toLowerCase().trim();
    return records.filter((record) => {
      const matchesTab = tab === "all" || record.type === tab;
      const matchesSearch =
        !term ||
        record.description.toLowerCase().includes(term) ||
        (record.method ?? "").toLowerCase().includes(term) ||
        (record.status ?? "").toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [records, search, tab]);

  const handleDelete = async (record: HistoryRecord) => {
    try {
      await deleteHistoryRecord(record.id, record.type);
      toast.success(`Registro de ${typeLabel(record.type).toLowerCase()} excluído.`);
      setSelectedRecord(null);
      await load();
    } catch {
      toast.error("Não foi possível excluir o registro.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Sistema"
        title="Histórico"
        description="Central de todas as movimentações: importações, vendas, despesas e metas."
      />

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              tab === t.value
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-surface text-muted-foreground hover:bg-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="surface-card mb-6 flex items-center gap-3 rounded-xl px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por descrição, método, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="surface-card h-20 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <section className="surface-card rounded-2xl p-6 text-center sm:p-10">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary">
            <History className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Nenhum registro encontrado.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            As movimentações aparecerão aqui conforme você registra importações, vendas, despesas e metas.
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <article
              key={`${record.type}-${record.id}`}
              onClick={() => setSelectedRecord(record)}
              className="surface-card group cursor-pointer rounded-xl p-4 transition-colors hover:bg-surface/80"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${typeBadge(record.type)}`}>
                    {typeLabel(record.type)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold">{record.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(record.date).toLocaleDateString("pt-BR")}
                      {record.method && ` · ${record.method}`}
                      {record.status && ` · ${record.status}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-display text-base font-bold tabular-nums ${
                      record.type === "expense" ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {record.type === "expense" ? "-" : ""}
                    {formatBRL(record.value)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmTarget(record);
                    }}
                    data-tooltip="Excluir registro"
                    className="tooltip rounded-lg p-2 text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Excluir registro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <HistoryDetailDialog
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onDelete={() => selectedRecord && setConfirmTarget(selectedRecord)}
      />

      <ConfirmDialog
        open={confirmTarget !== null}
        title={`Excluir ${confirmTarget ? typeLabel(confirmTarget.type).toLowerCase() : "registro"}`}
        description="Esta ação não pode ser desfeita. O registro será removido permanentemente do histórico."
        confirmLabel="Excluir"
        onConfirm={() => confirmTarget && void handleDelete(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}
