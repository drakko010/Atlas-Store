/**
 * BusinessSimulator
 *
 * Simula uma operação de compra e venda antes de realizá-la.
 * Não registra nada no banco.
 */

export type SimulatorInput = {
  quantity: number;
  costPerPiece: number;
  salePrice: number;
  paymentFee: number;
  otherCosts: number;
  availablePercentage: number;
  reinvestmentPercentage: number;
};

export type SimulatorResult = {
  investment: number;
  revenue: number;
  costs: number;
  profit: number;
  available: number;
  reinvestment: number;
  margin: number;
  roi: number;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateSimulation(input: SimulatorInput): SimulatorResult {
  const { quantity, costPerPiece, salePrice, paymentFee, otherCosts, availablePercentage, reinvestmentPercentage } = input;

  const investment = round(costPerPiece * quantity);
  const revenue = round(salePrice * quantity);
  const costs = round(costPerPiece * quantity + paymentFee + otherCosts);
  const profit = round(revenue - costs);
  const available = profit > 0 ? round((profit * availablePercentage) / 100) : 0;
  const reinvestment = profit > 0 ? round((profit * reinvestmentPercentage) / 100) : 0;
  const margin = revenue > 0 ? round((profit / revenue) * 100) : 0;
  const roi = investment > 0 ? round((profit / investment) * 100) : 0;

  return {
    investment,
    revenue,
    costs,
    profit,
    available,
    reinvestment,
    margin,
    roi,
  };
}

/** Valida o exemplo obrigatório do simulador. */
export function validateSimulatorExample(): SimulatorResult {
  return calculateSimulation({
    quantity: 20,
    costPerPiece: 100,
    salePrice: 500,
    paymentFee: 0,
    otherCosts: 0,
    availablePercentage: 50,
    reinvestmentPercentage: 50,
  });
}
