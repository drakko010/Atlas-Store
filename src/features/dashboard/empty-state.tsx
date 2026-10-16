import Link from "next/link";
import { Plus, Ship } from "lucide-react";

export function DashboardEmptyState() {
  return (
    <section className="surface-card rounded-2xl p-6 text-center sm:p-10">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/12 text-primary">
        <Ship className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Nenhuma importação cadastrada ainda.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Cadastre sua primeira importação para acompanhar capital investido, custo real, receita e
        lucro potencial em tempo real.
      </p>
      <Link
        href="/importacoes"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Nova importação
      </Link>
    </section>
  );
}
