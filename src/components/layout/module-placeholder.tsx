import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

/**
 * Placeholder padrão dos módulos ainda não implementados.
 * Cada rota lista o que será construído nela, mantendo o layout consistente.
 */
export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
  upcoming,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  upcoming: string[];
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <div className="surface-card rounded-2xl p-5 sm:p-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Módulo em preparação</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A estrutura está pronta. Os próximos passos deste módulo:
        </p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {upcoming.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-3 text-sm"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
