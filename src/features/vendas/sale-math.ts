/**
 * SaleMath
 *
 * Motor de cálculo de vendas da Atlas Store.
 * Calcula receita, custo, lucro e divisão entre disponível e reinvestimento.
 */

export type SaleInput = {
  salePrice: number;
  quantity: number;
  unitCost: number;
  paymentFee: number;
  otherCosts: number;
};

export type SaleSplitConfig = {
  availablePercentage: number;
  reinvestmentPercentage: number;
};

export type SaleResult = {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  availableProfit: number;
  reinvestmentProfit: number;
  paymentFee: number;
  otherCosts: number;
  isLoss: boolean;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateSale(
  input: SaleInput,
  config: SaleSplitConfig,
): SaleResult {
  const { salePrice, quantity, unitCost, paymentFee, otherCosts } = input;

  const totalRevenue = round(salePrice * quantity);
  const totalCost = round(unitCost * quantity);
  const grossProfit = round(totalRevenue - totalCost - paymentFee - otherCosts);
  const isLoss = grossProfit < 0;

  const availableProfit = isLoss ? 0 : round((grossProfit * config.availablePercentage) / 100);
  const reinvestmentProfit = isLoss
    ? 0
    : round((grossProfit * config.reinvestmentPercentage) / 100);

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    availableProfit,
    reinvestmentProfit,
    paymentFee,
    otherCosts,
    isLoss,
  };
}

/** Valida o exemplo obrigatório da Atlas Store. */
export function validateAtlasExample(): SaleResult {
  return calculateSale(
    {
      salePrice: 500,
      quantity: 1,
      unitCost: 100,
      paymentFee: 0,
      otherCosts: 0,
    },
    { availablePercentage: 50, reinvestmentPercentage: 50 },
  );
}
