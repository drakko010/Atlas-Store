/**
 * Domínio de importações da Atlas Store.
 *
 * - Status e fluxo da importação (orçamento → estoque).
 * - Conversão de custos moeda → BRL usando o câmbio CONGELADO da importação.
 * - Rateio proporcional dos custos compartilhados pelo valor dos produtos.
 */

export type ImportationStatus =
  | "pending"
  | "budget"
  | "awaiting_payment"
  | "purchased"
  | "preparing"
  | "shipped"
  | "in_transit"
  | "arrived_brazil"
  | "customs"
  | "received"
  | "completed"
  | "cancelled";

export const STATUS_FLOW: {
  key: ImportationStatus;
  label: string;
  emoji: string;
}[] = [
  { key: "budget", label: "Orçamento", emoji: "📝" },
  { key: "awaiting_payment", label: "Aguardando pagamento", emoji: "💳" },
  { key: "purchased", label: "Comprado", emoji: "🛒" },
  { key: "preparing", label: "Preparando envio", emoji: "📦" },
  { key: "shipped", label: "Enviado", emoji: "🚚" },
  { key: "in_transit", label: "Em trânsito", emoji: "✈️" },
  { key: "arrived_brazil", label: "Chegou ao Brasil", emoji: "🇧🇷" },
  { key: "customs", label: "Em desembaraço", emoji: "📋" },
  { key: "received", label: "Recebido", emoji: "📥" },
  { key: "completed", label: "Finalizado", emoji: "✅" },
];

export const STATUS_CANCELLED: ImportationStatus = "cancelled";

export function statusMeta(key: string): { label: string; emoji: string } {
  if (key === "cancelled") return { label: "Cancelado", emoji: "❌" };
  if (key === "pending") return { label: "Orçamento", emoji: "📝" };
  return STATUS_FLOW.find((s) => s.key === key) ?? { label: key, emoji: "•" };
}

export function isInProgress(status: string): boolean {
  return !["received", "completed", "cancelled"].includes(status);
}

export function canReceiveStock(status: string): boolean {
  return status === "received" || status === "completed";
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export type ImportItemInput = {
  productId: string;
  quantity: number;
  /** Preço unitário na moeda da importação. */
  unitPrice: number;
  /** Peso unitário em kg. */
  unitWeight: number;
};

export type ImportCostInput = {
  /** Câmbio congelado (BRL por 1 unidade da moeda). */
  exchangeRate: number;
  /** Frete na moeda da importação. */
  shipping: number;
  /** Taxas na moeda da importação. */
  fees: number;
  /** Seguro na moeda da importação. */
  insurance: number;
  /** Impostos em BRL. */
  taxesBRL: number;
  /** Outros custos em BRL. */
  otherBRL: number;
};

export type ApportionedItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitWeight: number;
  /** Valor da linha na moeda da importação. */
  lineForeign: number;
  /** Valor da linha em BRL (câmbio congelado). */
  lineBRL: number;
  /** Custos compartilhados rateados (BRL). */
  sharedBRL: number;
  /** Custo final da linha (BRL). */
  finalCostBRL: number;
  /** Custo final por unidade (BRL). */
  unitCostBRL: number;
};

export type ImportTotals = {
  productForeign: number;
  productBRL: number;
  shippingForeign: number;
  shippingBRL: number;
  feesForeign: number;
  feesBRL: number;
  insuranceForeign: number;
  insuranceBRL: number;
  taxesBRL: number;
  otherBRL: number;
  /** Custos compartilhados totais em BRL (frete+taxas+seguro+impostos+outros). */
  sharedBRL: number;
  totalBRL: number;
  totalPieces: number;
  averageCostPerPiece: number;
};

/**
 * Rateio dos custos compartilhados proporcional ao valor dos produtos
 * (valor da linha em BRL). Garante que produtos mais caros absorvam
 * uma fatia maior de frete/taxas/impostos.
 */
export function calculateImportation(
  items: ImportItemInput[],
  costs: ImportCostInput,
): { items: ApportionedItem[]; totals: ImportTotals } {
  const rate = costs.exchangeRate;

  const baseItems = items.map((item) => {
    const lineForeign = round(item.unitPrice * item.quantity);
    return { ...item, lineForeign, lineBRL: round(lineForeign * rate) };
  });

  const productForeign = round(baseItems.reduce((s, i) => s + i.lineForeign, 0));
  const productBRL = round(productForeign * rate);

  const shippingBRL = round(costs.shipping * rate);
  const feesBRL = round(costs.fees * rate);
  const insuranceBRL = round(costs.insurance * rate);
  const taxesBRL = round(costs.taxesBRL);
  const otherBRL = round(costs.otherBRL);

  const sharedBRL = round(shippingBRL + feesBRL + insuranceBRL + taxesBRL + otherBRL);
  const totalBRL = round(productBRL + sharedBRL);

  // Rateio proporcional pelo valor da linha; o resíduo de arredondamento
  // vai para o último item para o total bater exatamente.
  const apportioned: ApportionedItem[] = baseItems.map((item) => {
    const proportion = productBRL > 0 ? item.lineBRL / productBRL : 0;
    const shared = round(sharedBRL * proportion);
    const finalCostBRL = round(item.lineBRL + shared);
    return {
      ...item,
      sharedBRL: shared,
      finalCostBRL,
      unitCostBRL: item.quantity > 0 ? round(finalCostBRL / item.quantity) : 0,
    };
  });

  const allocatedSum = apportioned.reduce((s, i) => s + i.sharedBRL, 0);
  if (apportioned.length > 0) {
    const last = apportioned[apportioned.length - 1]!;
    const diff = round(sharedBRL - allocatedSum);
    if (diff !== 0) {
      last.sharedBRL = round(last.sharedBRL + diff);
      last.finalCostBRL = round(last.lineBRL + last.sharedBRL);
      last.unitCostBRL = last.quantity > 0 ? round(last.finalCostBRL / last.quantity) : 0;
    }
  }

  const totalPieces = items.reduce((s, i) => s + i.quantity, 0);

  return {
    items: apportioned,
    totals: {
      productForeign,
      productBRL,
      shippingForeign: round(costs.shipping),
      shippingBRL,
      feesForeign: round(costs.fees),
      feesBRL,
      insuranceForeign: round(costs.insurance),
      insuranceBRL,
      taxesBRL,
      otherBRL,
      sharedBRL,
      totalBRL,
      totalPieces,
      averageCostPerPiece: totalPieces > 0 ? round(totalBRL / totalPieces) : 0,
    },
  };
}

/** Média ponderada de custo ao dar entrada no estoque. */
export function weightedUnitCost(
  currentQty: number,
  currentUnit: number,
  addQty: number,
  addUnit: number,
): number {
  const total = currentQty + addQty;
  if (total <= 0) return round(addUnit);
  return round((currentQty * currentUnit + addQty * addUnit) / total);
}
