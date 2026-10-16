"use server";

import { and, eq, gte, lte, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { importations, products, sales } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { toNumber } from "@/lib/database";

export type FinancePeriod = "today" | "week" | "month" | "year" | "custom";

export type FinanceFilters = {
  period: FinancePeriod;
  startDate?: string;
  endDate?: string;
};

export type PeriodPoint = {
  label: string;
  revenue: number;
  profit: number;
  available: number;
  reinvestment: number;
};

export type FinanceData = {
  revenue: number;
  costs: number;
  grossProfit: number;
  availableProfit: number;
  reinvestment: number;
  expenses: number;
  netResult: number;
  margin: number;
  roi: number;
  averageTicket: number;
  averageProfitPerPiece: number;
  averageCostPerPiece: number;
  piecesSold: number;
  importCosts: number;
  points: PeriodPoint[];
};

function getDateRange(period: FinancePeriod, start?: string, end?: string): { start: Date; end: Date } {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      return { start, end: now };
    }
    case "custom":
    default: {
      const startDate = start ? new Date(start) : new Date(now.getFullYear(), 0, 1);
      const endDate = end ? new Date(end) : now;
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { start: startDate, end: endDate };
    }
  }
}

function formatDateLabel(date: Date, period: FinancePeriod): string {
  if (period === "today") return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (period === "week") return date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" });
  if (period === "month") return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function generatePoints(
  salesRows: { saleDate: string; totalRevenue: string; grossProfit: string; availableProfit: string; reinvestmentProfit: string }[],
  period: FinancePeriod,
  start: Date,
  end: Date,
): PeriodPoint[] {
  const points: PeriodPoint[] = [];

  if (period === "today") {
    // Agrupa por hora
    for (let i = 0; i < 24; i += 3) {
      const hourStart = new Date(start);
      hourStart.setHours(i, 0, 0, 0);
      const hourEnd = new Date(start);
      hourEnd.setHours(i + 2, 59, 59, 999);
      points.push({ label: `${String(i).padStart(2, "0")}h`, revenue: 0, profit: 0, available: 0, reinvestment: 0 });
    }
  } else if (period === "week") {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      points.push({ label: formatDateLabel(new Date(d), period), revenue: 0, profit: 0, available: 0, reinvestment: 0 });
    }
  } else if (period === "month") {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      points.push({ label: formatDateLabel(new Date(d), period), revenue: 0, profit: 0, available: 0, reinvestment: 0 });
    }
  } else {
    // Ano ou custom: agrupa por mês
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      points.push({ label: formatDateLabel(new Date(current), "year"), revenue: 0, profit: 0, available: 0, reinvestment: 0 });
      current.setMonth(current.getMonth() + 1);
    }
  }

  for (const sale of salesRows) {
    const date = new Date(sale.saleDate);
    let point: PeriodPoint | undefined;

    if (period === "today") {
      const hour = date.getHours();
      const bucketIndex = Math.floor(hour / 3);
      point = points[Math.min(bucketIndex, points.length - 1)];
    } else if (period === "year" || period === "custom") {
      point = points.find((p) => p.label === formatDateLabel(date, "year"));
    } else {
      point = points.find((p) => p.label === formatDateLabel(date, period));
    }

    if (point) {
      point.revenue += toNumber(sale.totalRevenue);
      point.profit += toNumber(sale.grossProfit);
      point.available += toNumber(sale.availableProfit);
      point.reinvestment += toNumber(sale.reinvestmentProfit);
    }
  }

  return points;
}

export async function getFinanceData(filters: FinanceFilters): Promise<FinanceData> {
  const userId = await getCurrentUserId();
  const { start, end } = getDateRange(filters.period, filters.startDate, filters.endDate);

  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  const [salesRows, importRows, productRows] = await Promise.all([
    db
      .select({
        saleDate: sales.saleDate,
        totalRevenue: sales.totalRevenue,
        totalCost: sales.totalCost,
        grossProfit: sales.grossProfit,
        availableProfit: sales.availableProfit,
        reinvestmentProfit: sales.reinvestmentProfit,
        quantity: sales.quantity,
      })
      .from(sales)
      .where(
        and(
          eq(sales.userId, userId),
          gte(sales.saleDate, startStr),
          lte(sales.saleDate, endStr),
        ),
      ),
    db
      .select({ totalCost: importations.totalCost, status: importations.status })
      .from(importations)
      .where(eq(importations.userId, userId)),
    db
      .select({ totalCost: products.totalCost, quantity: products.quantity })
      .from(products)
      .where(eq(products.userId, userId)),
  ]);

  const revenue = salesRows.reduce((sum, s) => sum + toNumber(s.totalRevenue), 0);
  const costs = salesRows.reduce((sum, s) => sum + toNumber(s.totalCost), 0);
  const grossProfit = salesRows.reduce((sum, s) => sum + toNumber(s.grossProfit), 0);
  const availableProfit = salesRows.reduce((sum, s) => sum + toNumber(s.availableProfit), 0);
  const reinvestment = salesRows.reduce((sum, s) => sum + toNumber(s.reinvestmentProfit), 0);
  const piecesSold = salesRows.reduce((sum, s) => sum + s.quantity, 0);

  // Despesas: por enquanto 0 (módulo de despesas não implementado ainda)
  const expenses = 0;
  const netResult = grossProfit - expenses;

  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const roi = costs > 0 ? (grossProfit / costs) * 100 : 0;
  const averageTicket = piecesSold > 0 ? revenue / piecesSold : 0;
  const averageProfitPerPiece = piecesSold > 0 ? grossProfit / piecesSold : 0;
  const averageCostPerPiece = piecesSold > 0 ? costs / piecesSold : 0;

  const importCosts = importRows
    .filter((i) => i.status !== "cancelled")
    .reduce((sum, i) => sum + toNumber(i.totalCost), 0);

  const points = generatePoints(salesRows, filters.period, start, end);

  return {
    revenue,
    costs,
    grossProfit,
    availableProfit,
    reinvestment,
    expenses,
    netResult,
    margin,
    roi,
    averageTicket,
    averageProfitPerPiece,
    averageCostPerPiece,
    piecesSold,
    importCosts,
    points,
  };
}
