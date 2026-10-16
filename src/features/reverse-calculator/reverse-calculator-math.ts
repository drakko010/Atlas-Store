/**
 * ReverseCalculator
 *
 * Calcula qual preço de venda é necessário para atingir
 * um lucro disponível desejado, considerando custo, taxas
 * e a divisão configurável entre disponível e reinvestimento.
 */

export type ReverseCalculatorInput = {
  cost: number;
  fees: number;
  desiredAvailableProfit: number;
  availablePercentage: number;
  reinvestmentPercentage: number;
};

export type ReverseCalculatorResult = {
  desiredAvailableProfit: number;
  requiredTotalProfit: number;
  requiredSalePrice: number;
  minimumPrice: number;
  recommendedPrice: number;
  totalProfit: number;
  availableProfit: number;
  reinvestmentProfit: number;
  margin: number;
  roi: number;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateRequiredSalePrice(
  input: ReverseCalculatorInput,
): ReverseCalculatorResult {
  const { cost, fees, desiredAvailableProfit, availablePercentage } = input;

  const availableRate = availablePercentage / 100;

  // Se quero X disponíveis e disponível = lucro_total × %_disponível
  // então lucro_total = X / %_disponível
  const requiredTotalProfit =
    availableRate > 0 ? round(desiredAvailableProfit / availableRate) : 0;

  // Preço de venda = custo + taxas + lucro_total
  const requiredSalePrice = round(cost + fees + requiredTotalProfit);

  // Preço mínimo: custo + taxas (ponto de equilíbrio, lucro zero)
  const minimumPrice = round(cost + fees);

  // Preço recomendado: arredonda para valor psicológico
  const recommendedPrice = round(Math.ceil(requiredSalePrice / 10) * 10 - 0.01);

  // Valores finais baseados no preço recomendado
  const totalProfit = round(recommendedPrice - cost - fees);
  const availableProfit =
    totalProfit > 0 ? round((totalProfit * availablePercentage) / 100) : 0;
  const reinvestmentProfit =
    totalProfit > 0
      ? round((totalProfit * input.reinvestmentPercentage) / 100)
      : 0;

  const margin = recommendedPrice > 0 ? round((totalProfit / recommendedPrice) * 100) : 0;
  const roi = cost > 0 ? round((totalProfit / cost) * 100) : 0;

  return {
    desiredAvailableProfit,
    requiredTotalProfit,
    requiredSalePrice,
    minimumPrice,
    recommendedPrice,
    totalProfit,
    availableProfit,
    reinvestmentProfit,
    margin,
    roi,
  };
}

/** Valida o exemplo obrigatório. */
export function validateReverseExample(): ReverseCalculatorResult {
  return calculateRequiredSalePrice({
    cost: 100,
    fees: 0,
    desiredAvailableProfit: 200,
    availablePercentage: 50,
    reinvestmentPercentage: 50,
  });
}
