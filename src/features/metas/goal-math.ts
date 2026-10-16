/**
 * GoalMath
 *
 * Motor de cálculo de metas da Atlas Store.
 * As metas são atingidas apenas com o lucro disponível das vendas.
 */

export type GoalProjectionInput = {
  targetAmount: number;
  salePrice: number;
  unitCost: number;
  availablePercentage: number;
  reinvestmentPercentage: number;
};

export type GoalProjection = {
  targetAmount: number;
  profitPerPiece: number;
  availableProfitPerPiece: number;
  piecesNeeded: number;
  requiredRevenue: number;
  requiredCost: number;
  requiredProfit: number;
  requiredReinvestment: number;
  requiredAvailable: number;
};

export type GoalProgress = {
  currentAmount: number;
  targetAmount: number;
  percentComplete: number;
  remainingAmount: number;
  piecesSold: number;
  piecesRemaining: number;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateGoalProjection(
  input: GoalProjectionInput,
): GoalProjection {
  const { targetAmount, salePrice, unitCost, availablePercentage, reinvestmentPercentage } = input;

  const profitPerPiece = round(salePrice - unitCost);
  const availableProfitPerPiece = round((profitPerPiece * availablePercentage) / 100);
  const piecesNeeded =
    availableProfitPerPiece > 0 ? Math.ceil(targetAmount / availableProfitPerPiece) : 0;

  const requiredRevenue = round(piecesNeeded * salePrice);
  const requiredCost = round(piecesNeeded * unitCost);
  const requiredProfit = round(requiredRevenue - requiredCost);
  const requiredReinvestment = round((requiredProfit * reinvestmentPercentage) / 100);
  const requiredAvailable = round((requiredProfit * availablePercentage) / 100);

  return {
    targetAmount,
    profitPerPiece,
    availableProfitPerPiece,
    piecesNeeded,
    requiredRevenue,
    requiredCost,
    requiredProfit,
    requiredReinvestment,
    requiredAvailable,
  };
}

export function calculateGoalProgress(
  currentAmount: number,
  targetAmount: number,
  availableProfitPerPiece: number,
): GoalProgress {
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);
  const percentComplete = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const piecesSold =
    availableProfitPerPiece > 0 ? Math.floor(currentAmount / availableProfitPerPiece) : 0;
  const piecesRemaining =
    availableProfitPerPiece > 0 ? Math.ceil(remainingAmount / availableProfitPerPiece) : 0;

  return {
    currentAmount: round(currentAmount),
    targetAmount,
    percentComplete: round(percentComplete),
    remainingAmount: round(remainingAmount),
    piecesSold,
    piecesRemaining,
  };
}

/** Valida o exemplo obrigatório da Atlas Store. */
export function validateGoalExample(): GoalProjection {
  return calculateGoalProjection({
    targetAmount: 3000,
    salePrice: 500,
    unitCost: 100,
    availablePercentage: 50,
    reinvestmentPercentage: 50,
  });
}
