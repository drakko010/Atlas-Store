/**
 * CSSBuyCalculator
 *
 * Motor de cálculo independente para estimativa de custo de importação
 * CSSBuy (China) → Brasil. Moeda principal: CNY / ¥.
 * Todas as alíquotas são configuráveis e o resultado é uma estimativa.
 */

export type WeightUnit = "kg" | "g";

export type CSSBuyInput = {
  /** Valor do produto em CNY. */
  productPrice: number;
  /** Frete doméstico na China em CNY. */
  domesticShipping: number;
  /** Taxa de serviço CSSBuy em CNY. */
  serviceFee: number;
  /** Outros custos na China em CNY. */
  otherChinaCosts: number;
  /** Peso do pacote. */
  weight: number;
  /** Unidade do peso: kg ou g. */
  weightUnit: WeightUnit;
  /** Frete internacional em CNY. */
  internationalShipping: number;
  /** Seguro em CNY. */
  insurance: number;
  /** Valor declarado para tributação em CNY. */
  declaredValue: number;
  /** Cotação do Yuan (BRL/CNY). */
  yuanRate: number;
  /** Quantidade de peças no pacote. */
  quantity: number;
};

export type CSSBuyConfig = {
  /** Percentual de impostos sobre o valor declarado. Padrão: 60. */
  taxRate: number;
  /** Outras taxas em BRL. Padrão: 0. */
  otherFees: number;
};

export type CSSBuyResult = {
  /** Produto em BRL. */
  productBRL: number;
  /** Frete doméstico na China em BRL. */
  domesticShippingBRL: number;
  /** Taxa de serviço CSSBuy em BRL. */
  serviceFeeBRL: number;
  /** Outros custos na China em BRL. */
  otherChinaCostsBRL: number;
  /** Frete internacional em BRL. */
  internationalShippingBRL: number;
  /** Seguro em BRL. */
  insuranceBRL: number;
  /** Impostos em BRL. */
  taxesBRL: number;
  /** Outras taxas em BRL. */
  otherFeesBRL: number;
  /** Peso em kg. */
  weightKg: number;
  /** Custo final estimado em BRL. */
  totalCostBRL: number;
  /** Custo por peça em BRL. */
  costPerPieceBRL: number;
  /** Base tributária em BRL. */
  taxBaseBRL: number;
};

const DEFAULT_CONFIG: CSSBuyConfig = {
  taxRate: 60,
  otherFees: 0,
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toKg(weight: number, unit: WeightUnit): number {
  return unit === "g" ? weight / 1000 : weight;
}

export function calculateCSSBuy(
  input: CSSBuyInput,
  config: Partial<CSSBuyConfig> = {},
): CSSBuyResult {
  const {
    productPrice,
    domesticShipping,
    serviceFee,
    otherChinaCosts,
    weight,
    weightUnit,
    internationalShipping,
    insurance,
    declaredValue,
    yuanRate,
    quantity,
  } = input;

  const { taxRate, otherFees } = { ...DEFAULT_CONFIG, ...config };

  const weightKg = toKg(weight, weightUnit);
  const safeQuantity = Math.max(quantity || 1, 1);

  const productBRL = round(productPrice * yuanRate);
  const domesticShippingBRL = round(domesticShipping * yuanRate);
  const serviceFeeBRL = round(serviceFee * yuanRate);
  const otherChinaCostsBRL = round(otherChinaCosts * yuanRate);
  const internationalShippingBRL = round(internationalShipping * yuanRate);
  const insuranceBRL = round(insurance * yuanRate);

  const taxBaseBRL = round(declaredValue * yuanRate);
  const taxesBRL = round(taxBaseBRL * (taxRate / 100));
  const otherFeesBRL = round(otherFees);

  const totalCostBRL = round(
    productBRL +
      domesticShippingBRL +
      serviceFeeBRL +
      otherChinaCostsBRL +
      internationalShippingBRL +
      insuranceBRL +
      taxesBRL +
      otherFeesBRL,
  );

  const costPerPieceBRL = round(totalCostBRL / safeQuantity);

  return {
    productBRL,
    domesticShippingBRL,
    serviceFeeBRL,
    otherChinaCostsBRL,
    internationalShippingBRL,
    insuranceBRL,
    taxesBRL,
    otherFeesBRL,
    weightKg,
    totalCostBRL,
    costPerPieceBRL,
    taxBaseBRL,
  };
}

/** Testa a calculadora com valores fictícios e retorna os resultados. */
export function testCSSBuyCalculator(): CSSBuyResult[] {
  const config: CSSBuyConfig = {
    taxRate: 60,
    otherFees: 50,
  };

  return [
    calculateCSSBuy(
      {
        productPrice: 200,
        domesticShipping: 15,
        serviceFee: 25,
        otherChinaCosts: 10,
        weight: 800,
        weightUnit: "g",
        internationalShipping: 120,
        insurance: 0,
        declaredValue: 200,
        yuanRate: 0.72,
        quantity: 2,
      },
      config,
    ),
    calculateCSSBuy(
      {
        productPrice: 500,
        domesticShipping: 30,
        serviceFee: 50,
        otherChinaCosts: 0,
        weight: 1.5,
        weightUnit: "kg",
        internationalShipping: 250,
        insurance: 20,
        declaredValue: 500,
        yuanRate: 0.75,
        quantity: 1,
      },
      config,
    ),
  ];
}
