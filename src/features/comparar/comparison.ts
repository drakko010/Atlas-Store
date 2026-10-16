/**
 * Comparador de importação: USCloser vs CSSBuy
 *
 * Reutiliza os motores de cálculo existentes sem modificá-los
 * e apresenta uma comparação lado a lado dos custos finais.
 */

import { calculateUSCloser, type USCloserConfig, type USCloserInput } from "@/features/uscloser/calculator";
import {
  calculateCSSBuy,
  type CSSBuyConfig,
  type CSSBuyInput,
} from "@/features/cssbuy/calculator";

export type USCloserCompareInput = {
  productPrice: number;
  declaredValue: number;
  declaredShipping: number;
  commercialRate: number;
};

export type CSSBuyCompareInput = {
  productPrice: number;
  domesticShipping: number;
  serviceFee: number;
  otherChinaCosts: number;
  weight: number;
  weightUnit: "kg" | "g";
  internationalShipping: number;
  insurance: number;
  declaredValue: number;
  yuanRate: number;
};

export type MethodComparison = {
  method: "USCloser" | "CSSBuy";
  productCost: number;
  shipping: number;
  taxes: number;
  fees: number;
  finalCost: number;
  costPerPiece: number;
};

export type ComparisonResult = {
  usCloser: MethodComparison;
  cssBuy: MethodComparison;
  winner: "USCloser" | "CSSBuy" | "tie";
  differenceBRL: number;
  differencePercent: number;
  savingsLabel: string;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function compareImportation(
  usCloserInput: USCloserCompareInput,
  cssBuyInput: CSSBuyCompareInput,
  usCloserConfig: Partial<USCloserConfig> = {},
  cssBuyConfig: Partial<CSSBuyConfig> = {},
  quantity = 1,
): ComparisonResult {
  const usCloserResult = calculateUSCloser(
    {
      ...usCloserInput,
      weightLb: 1,
      brazilPrice: null,
    },
    usCloserConfig,
  );

  const cssBuyResult = calculateCSSBuy(
    {
      ...cssBuyInput,
      quantity,
    },
    cssBuyConfig,
  );

  const usCloser: MethodComparison = {
    method: "USCloser",
    productCost: usCloserResult.productBRL,
    shipping: usCloserResult.shippingBRL,
    taxes: usCloserResult.importTaxBRL + usCloserResult.icmsBRL,
    fees: usCloserResult.otherFeesBRL,
    finalCost: usCloserResult.totalCostBRL,
    costPerPiece: quantity > 1 ? round(usCloserResult.totalCostBRL / quantity) : usCloserResult.totalCostBRL,
  };

  const cssBuy: MethodComparison = {
    method: "CSSBuy",
    productCost: cssBuyResult.productBRL,
    shipping: cssBuyResult.domesticShippingBRL + cssBuyResult.internationalShippingBRL,
    taxes: cssBuyResult.taxesBRL,
    fees: cssBuyResult.serviceFeeBRL + cssBuyResult.otherChinaCostsBRL + cssBuyResult.otherFeesBRL + cssBuyResult.insuranceBRL,
    finalCost: cssBuyResult.totalCostBRL,
    costPerPiece: cssBuyResult.costPerPieceBRL,
  };

  const differenceBRL = round(usCloser.finalCost - cssBuy.finalCost);
  const cheaper = differenceBRL > 0 ? "CSSBuy" : differenceBRL < 0 ? "USCloser" : "tie";
  const winnerFinalCost = cheaper === "CSSBuy" ? cssBuy.finalCost : usCloser.finalCost;
  const differencePercent =
    winnerFinalCost === 0 ? 0 : round((Math.abs(differenceBRL) / winnerFinalCost) * 100);

  const savingsLabel =
    cheaper === "tie"
      ? "Os dois métodos têm o mesmo custo."
      : cheaper === "CSSBuy"
        ? `CSSBuy é ${formatBRLDiff(Math.abs(differenceBRL))} mais barato.`
        : `USCloser é ${formatBRLDiff(Math.abs(differenceBRL))} mais barato.`;

  return {
    usCloser,
    cssBuy,
    winner: cheaper,
    differenceBRL: Math.abs(differenceBRL),
    differencePercent,
    savingsLabel,
  };
}

function formatBRLDiff(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Testa o comparador com valores fictícios. */
export function testComparison(): ComparisonResult {
  return compareImportation(
    {
      productPrice: 100,
      declaredValue: 100,
      declaredShipping: 20,
      commercialRate: 5.1,
    },
    {
      productPrice: 700,
      domesticShipping: 30,
      serviceFee: 50,
      otherChinaCosts: 20,
      weight: 1,
      weightUnit: "kg",
      internationalShipping: 180,
      insurance: 0,
      declaredValue: 700,
      yuanRate: 0.72,
    },
    { importTax: 60, icms: 17, otherFees: 50, usCloserRateFactor: 1.026 },
    { taxRate: 60, otherFees: 50 },
    1,
  );
}
