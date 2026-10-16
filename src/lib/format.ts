/** Formatação centralizada (BRL, percentuais, números). */

export function formatBRL(value: number, options?: { compact?: boolean }): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: options?.compact ? "compact" : "standard",
    maximumFractionDigits: options?.compact ? 1 : 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value)}%`;
}

/**
 * Converte texto digitado pelo usuário em número, aceitando
 * vírgula ou ponto como separador decimal de forma segura:
 * - "100,00" → 100
 * - "100.00" → 100
 * - "1.234.567" → 1234567 (milhar)
 * - "1.234,56" → 1234.56
 */
export function parseDecimalInput(value: string): number {
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
