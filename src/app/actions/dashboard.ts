"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  type DashboardData,
  type DashboardGoal,
  type FinanceMetric,
  type MonthPoint,
} from "@/features/dashboard/use-dashboard-data";
import { getCurrentUserId } from "@/lib/auth";
import { toNumber, DEFAULT_PROFIT_SPLIT } from "@/lib/database";
import { goals, importations, products, sales, settings } from "@/db/schema";

const MONTH_LABELS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function lastSixMonths(): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_LABELS[d.getMonth()]!,
    };
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const userId = await getCurrentUserId();

  const [importationsRows, productsRows, salesRows, settingsRow, goalRow] = await Promise.all([
    db
      .select({ totalCost: importations.totalCost, status: importations.status })
      .from(importations)
      .where(eq(importations.userId, userId)),
    db
      .select({
        quantity: products.quantity,
        salePrice: products.salePrice,
        totalCost: products.totalCost,
        unitCost: products.unitCost,
      })
      .from(products)
      .where(eq(products.userId, userId)),
    db
      .select({
        saleDate: sales.saleDate,
        totalRevenue: sales.totalRevenue,
        grossProfit: sales.grossProfit,
        availableProfit: sales.availableProfit,
        reinvestmentProfit: sales.reinvestmentProfit,
      })
      .from(sales)
      .where(eq(sales.userId, userId)),
    db
      .select({
        availableProfitPercentage: settings.availableProfitPercentage,
        reinvestmentPercentage: settings.reinvestmentPercentage,
      })
      .from(settings)
      .where(eq(settings.userId, userId))
      .then((rows) => rows[0] ?? null),
    db
      .select({
        name: goals.name,
        targetAmount: goals.targetAmount,
        currentAmount: goals.currentAmount,
        profitPerPiece: goals.profitPerPiece,
      })
      .from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.status, "active")))
      .orderBy(sql`${goals.createdAt} desc`)
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  const activeImports = importationsRows.filter((i) => i.status !== "cancelled");
  const investedCapital = activeImports.reduce(
    (sum, i) => sum + toNumber(i.totalCost),
    0,
  );
  const receivedCost = activeImports
    .filter((i) => i.status === "received" || i.status === "completed")
    .reduce((sum, i) => sum + toNumber(i.totalCost), 0);
  const totalCost = receivedCost > 0 ? receivedCost : investedCapital;

  const stock = productsRows;
  const potentialRevenue = stock.reduce(
    (sum, p) => sum + toNumber(p.quantity) * toNumber(p.salePrice),
    0,
  );
  // Custo real do estoque = quantidade atual × custo por peça
  // (unit_cost; fallback: total do lote ÷ quantidade).
  const stockCost = stock.reduce((sum, p) => {
    const unit =
      toNumber(p.unitCost) > 0
        ? toNumber(p.unitCost)
        : toNumber(p.totalCost) / Math.max(toNumber(p.quantity), 1);
    return sum + toNumber(p.quantity) * unit;
  }, 0);
  const potentialProfit = potentialRevenue - (stockCost > 0 ? stockCost : totalCost);

  const availablePct = toNumber(
    settingsRow?.availableProfitPercentage ?? DEFAULT_PROFIT_SPLIT.available,
  );
  const reinvestPct = toNumber(
    settingsRow?.reinvestmentPercentage ?? DEFAULT_PROFIT_SPLIT.reinvestment,
  );

  const realizedProfit = salesRows.reduce((sum, s) => sum + toNumber(s.grossProfit), 0);
  const realizedAvailable = salesRows.reduce(
    (sum, s) => sum + toNumber(s.availableProfit),
    0,
  );
  const realizedReinvest = salesRows.reduce(
    (sum, s) => sum + toNumber(s.reinvestmentProfit),
    0,
  );

  const availableProfit =
    realizedProfit > 0
      ? realizedAvailable
      : (potentialProfit * availablePct) / 100;
  const reinvestment =
    realizedProfit > 0 ? realizedReinvest : (potentialProfit * reinvestPct) / 100;

  const buckets = new Map(
    lastSixMonths().map((m) => [m.key, { month: m.label, receita: 0, lucro: 0 }]),
  );
  for (const sale of salesRows) {
    const key = String(sale.saleDate ?? "").slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.receita += toNumber(sale.totalRevenue);
    bucket.lucro += toNumber(sale.grossProfit);
  }

  const metrics: FinanceMetric[] = [
    {
      id: "capital",
      label: "Capital investido",
      value: investedCapital,
      hint: "Total aplicado nas importações ativas",
      emphasis: "neutral",
    },
    {
      id: "import-cost",
      label: "Custo total",
      value: totalCost,
      hint: "Custo real das importações",
    },
    {
      id: "potential-revenue",
      label: "Receita potencial",
      value: potentialRevenue,
      hint: "Estoque disponível × preço de venda",
      emphasis: "primary",
    },
    {
      id: "potential-profit",
      label: "Lucro potencial",
      value: potentialProfit,
      hint: "Receita potencial - custo real",
      emphasis: "positive",
    },
    {
      id: "available-profit",
      label: "Lucro disponível",
      value: availableProfit,
      hint: `${availablePct}% do lucro para retirada`,
      emphasis: "positive",
    },
    {
      id: "reinvestment",
      label: "Reinvestimento",
      value: reinvestment,
      hint: `${reinvestPct}% do lucro reservado`,
    },
  ];

  const dashboardGoal: DashboardGoal | null = goalRow
    ? {
        name: goalRow.name,
        targetValue: toNumber(goalRow.targetAmount),
        currentValue: toNumber(goalRow.currentAmount),
        averageTicket: toNumber(goalRow.profitPerPiece),
      }
    : null;

  return {
    metrics,
    goal: dashboardGoal,
    monthly: [...buckets.values()],
    counts: {
      importations: activeImports.length,
      products: stock.length,
      sales: salesRows.length,
    },
  };
}
