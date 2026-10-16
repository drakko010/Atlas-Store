/**
 * Lógica de custo real dos produtos Atlas Store.
 *
 * O custo total nunca deve ser apenas o preço de compra.
 * Ele considera: produto + frete + impostos + taxas + outros custos.
 *
 * Para importações com várias peças, os custos compartilhados são
 * distribuídos proporcionalmente para obter o custo médio por peça.
 */

export type ProductCostInput = {
  purchasePrice: number;
  importCost: number;
  quantity: number;
};

export type ProductCostBreakdown = {
  purchasePrice: number;
  importCost: number;
  totalCost: number;
  costPerPiece: number;
};

export function calculateProductCost(input: ProductCostInput): ProductCostBreakdown {
  const { purchasePrice, importCost, quantity } = input;
  const safeQuantity = Math.max(quantity || 1, 1);
  const totalCost = purchasePrice + importCost;
  const costPerPiece = totalCost / safeQuantity;

  return {
    purchasePrice,
    importCost,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerPiece: Math.round(costPerPiece * 100) / 100,
  };
}

/**
 * Distribui custos compartilhados de uma importação entre as peças.
 *
 * Exemplo:
 * - 10 peças
 * - Produtos: R$1.000
 * - Frete: R$300
 * - Impostos: R$400
 * - Taxas: R$100
 * - Total: R$1.800
 * - Custo médio: R$180 por peça.
 */
export function distributeImportCost(params: {
  productPrice: number;
  sharedCosts: number;
  quantity: number;
}): { importCostPerPiece: number; totalCostPerPiece: number } {
  const safeQuantity = Math.max(params.quantity || 1, 1);
  const importCostPerPiece = params.sharedCosts / safeQuantity;
  const totalCostPerPiece = (params.productPrice + params.sharedCosts) / safeQuantity;

  return {
    importCostPerPiece: Math.round(importCostPerPiece * 100) / 100,
    totalCostPerPiece: Math.round(totalCostPerPiece * 100) / 100,
  };
}
