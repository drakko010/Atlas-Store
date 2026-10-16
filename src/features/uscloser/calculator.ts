/**
 * USCloserCalculator
 *
 * Motor de cálculo independente para estimativa de custo de importação
 * USCloser → Brasil. Todas as alíquotas são configuráveis e o resultado
 * é uma estimativa.
 */

export type USCloserInput = {
  /** Valor real pago pelo produto (USD). */
  productPrice: number;
  /** Valor declarado do produto (USD). Inicialmente igual ao valor pago. */
  declaredValue: number;
  /** Peso considerado no envio (lb). */
  weightLb: number;
  /** Frete declarado (USD). */
  declaredShipping: number;
  /** Valor do item no Brasil (BRL), apenas para comparação. */
  brazilPrice: number | null;
  /** Cotação do dólar comercial (BRL/USD). */
  commercialRate: number;
};

export type USCloserConfig = {
  /** Percentual do imposto de importação. Padrão: 60. */
  importTax: number;
  /** Percentual do ICMS. Padrão: 17. */
  icms: number;
  /** Outras taxas em BRL. Padrão: 0. */
  otherFees: number;
  /** Fator UsCloser sobre o dólar comercial. Padrão: 1.026. */
  usCloserRateFactor: number;
};

export type USCloserResult = {
  /** Custo do produto em reais (valor pago × dólar UsCloser). */
  productBRL: number;
  /** Frete em reais (frete declarado × dólar UsCloser). */
  shippingBRL: number;
  /** Base tributária em reais ((declarado + frete) × dólar comercial). */
  taxBaseBRL: number;
  /** Imposto de importação em reais. */
  importTaxBRL: number;
  /** ICMS em reais (cálculo por dentro). */
  icmsBRL: number;
  /** Outras taxas em reais. */
  otherFeesBRL: number;
  /** Custo total estimado em reais. */
  totalCostBRL: number;
  /** Dólar UsCloser aplicado (comercial × fator). */
  usCloserRate: number;
  /** Economia / lucro comparando com valor no Brasil. */
  comparison: {
    brazilPrice: number;
    differenceBRL: number;
    differencePercent: number;
  } | null;
};

const DEFAULT_CONFIG: USCloserConfig = {
  importTax: 60,
  icms: 17,
  otherFees: 0,
  usCloserRateFactor: 1.026,
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateUSCloser(
  input: USCloserInput,
  config: Partial<USCloserConfig> = {},
): USCloserResult {
  const { productPrice, declaredValue, declaredShipping, brazilPrice, commercialRate } = input;
  const { importTax, icms, otherFees, usCloserRateFactor } = { ...DEFAULT_CONFIG, ...config };

  const usCloserRate = commercialRate * usCloserRateFactor;

  // Custo real convertido com dólar UsCloser
  const productBRL = round(productPrice * usCloserRate);
  const shippingBRL = round(declaredShipping * usCloserRate);

  // Base tributária convertida com dólar comercial
  const taxBaseUSD = declaredValue + declaredShipping;
  const taxBaseBRL = round(taxBaseUSD * commercialRate);

  // Imposto de importação
  const importTaxBRL = round(taxBaseBRL * (importTax / 100));

  // ICMS por dentro: (base + II) / (1 - alíquota) * alíquota
  const icmsRate = icms / 100;
  const icmsBRL =
    icmsRate >= 1 ? 0 : round((taxBaseBRL + importTaxBRL) / (1 - icmsRate) * icmsRate);

  // Outras taxas fixas em BRL
  const otherFeesBRL = round(otherFees);

  // Custo final
  const totalCostBRL = round(productBRL + shippingBRL + importTaxBRL + icmsBRL + otherFeesBRL);

  // Comparação com valor no Brasil
  let comparison: USCloserResult["comparison"] = null;
  if (brazilPrice && brazilPrice > 0) {
    const differenceBRL = round(brazilPrice - totalCostBRL);
    const differencePercent = round((differenceBRL / totalCostBRL) * 100);
    comparison = { brazilPrice, differenceBRL, differencePercent };
  }

  return {
    productBRL,
    shippingBRL,
    taxBaseBRL,
    importTaxBRL,
    icmsBRL,
    otherFeesBRL,
    totalCostBRL,
    usCloserRate,
    comparison,
  };
}

/** Testa a calculadora com valores fictícios e retorna os resultados. */
export function testUSCloserCalculator(): USCloserResult[] {
  const config: USCloserConfig = {
    importTax: 60,
    icms: 17,
    otherFees: 50,
    usCloserRateFactor: 1.026,
  };

  return [
    calculateUSCloser(
      {
        productPrice: 100,
        declaredValue: 100,
        weightLb: 1,
        declaredShipping: 20,
        brazilPrice: 1000,
        commercialRate: 5.1,
      },
      config,
    ),
    calculateUSCloser(
      {
        productPrice: 250,
        declaredValue: 250,
        weightLb: 2,
        declaredShipping: 45,
        brazilPrice: null,
        commercialRate: 5.2,
      },
      config,
    ),
  ];
}
