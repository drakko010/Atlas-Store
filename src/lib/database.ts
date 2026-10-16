/**
 * Camada de tipos e constantes do domínio Atlas Store.
 * Fonte única de verdade para regras de negócio compartilhadas
 * entre servidor e cliente.
 */

export type { User, Supplier, Product, Importation, ImportationItem } from "@/db/schema";
export type { Sale, SaleItem, Goal, Expense, CurrencyRate, Settings } from "@/db/schema";

/** Divisão padrão do lucro (configurável em settings). */
export const DEFAULT_PROFIT_SPLIT = { available: 50, reinvestment: 50 } as const;

/** Campos calculados no banco — preferencialmente nunca escritos pelo frontend. */
export const SERVER_COMPUTED_FIELDS = {
  products: ["total_cost"],
  importations: ["total_cost"],
  importation_items: ["unit_cost", "line_total_cost"],
  sales: ["total_revenue", "total_cost", "gross_profit", "available_profit", "reinvestment_profit"],
  sale_items: ["line_revenue", "line_cost"],
} as const;

/** Converte valores decimal do PostgreSQL para number de forma segura. */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isNaN(n) ? 0 : n;
}
