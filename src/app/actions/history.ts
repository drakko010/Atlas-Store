"use server";

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { importations, sales, expenses, goals, products } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { toNumber } from "@/lib/database";
import { deleteSale } from "@/app/actions/sales";

export type HistoryType = "importation" | "sale" | "expense" | "goal";

export type HistoryRecord =
  | {
      id: string;
      type: "importation";
      date: string;
      description: string;
      value: number;
      method: string;
      status: string;
      details: {
        supplier: string | null;
        originCountry: string | null;
        currency: string;
        exchangeRate: number;
        productTotal: number;
        shippingCost: number;
        taxes: number;
        fees: number;
        insurance: number;
        totalCost: number;
        notes: string | null;
      };
    }
  | {
      id: string;
      type: "sale";
      date: string;
      description: string;
      value: number;
      method: null;
      status: null;
      details: {
        productName: string;
        quantity: number;
        salePrice: number;
        totalRevenue: number;
        totalCost: number;
        grossProfit: number;
        availableProfit: number;
        reinvestmentProfit: number;
        paymentFee: number;
        otherCosts: number;
        notes: string | null;
      };
    }
  | {
      id: string;
      type: "expense";
      date: string;
      description: string;
      value: number;
      method: null;
      status: null;
      details: {
        category: string;
        amount: number;
        notes: string | null;
      };
    }
  | {
      id: string;
      type: "goal";
      date: string;
      description: string;
      value: number;
      method: null;
      status: string;
      details: {
        targetAmount: number;
        currentAmount: number;
        salePrice: number;
        unitCost: number;
        profitPerPiece: number;
        piecesNeeded: number;
        deadline: string | null;
      };
    };

export async function getHistory(): Promise<HistoryRecord[]> {
  const userId = await getCurrentUserId();

  const [importRows, saleRows, expenseRows, goalRows, productRows] = await Promise.all([
    db
      .select()
      .from(importations)
      .where(eq(importations.userId, userId))
      .orderBy(desc(importations.createdAt)),
    db
      .select()
      .from(sales)
      .where(eq(sales.userId, userId))
      .orderBy(desc(sales.saleDate)),
    db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.expenseDate)),
    db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt)),
    db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.userId, userId)),
  ]);

  const productMap = new Map(productRows.map((p) => [p.id, p.name]));

  const records: HistoryRecord[] = [
    ...importRows.map((i): HistoryRecord => ({
      id: i.id,
      type: "importation",
      date: i.createdAt.toISOString(),
      description: `Importação ${i.method} ${i.supplier ? `- ${i.supplier}` : ""}`,
      value: toNumber(i.totalCost),
      method: i.method,
      status: i.status,
      details: {
        supplier: i.supplier,
        originCountry: i.originCountry,
        currency: i.currency,
        exchangeRate: toNumber(i.exchangeRate),
        productTotal: toNumber(i.productTotal),
        shippingCost: toNumber(i.shippingCost),
        taxes: toNumber(i.taxes),
        fees: toNumber(i.fees),
        insurance: toNumber(i.insurance),
        totalCost: toNumber(i.totalCost),
        notes: i.notes,
      },
    })),
    ...saleRows.map((s): HistoryRecord => ({
      id: s.id,
      type: "sale",
      date: s.saleDate,
      description: `Venda de ${productMap.get(s.productId) ?? "produto"}`,
      value: toNumber(s.totalRevenue),
      method: null,
      status: null,
      details: {
        productName: productMap.get(s.productId) ?? "Produto",
        quantity: s.quantity,
        salePrice: toNumber(s.salePrice),
        totalRevenue: toNumber(s.totalRevenue),
        totalCost: toNumber(s.totalCost),
        grossProfit: toNumber(s.grossProfit),
        availableProfit: toNumber(s.availableProfit),
        reinvestmentProfit: toNumber(s.reinvestmentProfit),
        paymentFee: toNumber(s.paymentFee),
        otherCosts: toNumber(s.otherCosts),
        notes: s.notes,
      },
    })),
    ...expenseRows.map((e): HistoryRecord => ({
      id: e.id,
      type: "expense",
      date: e.expenseDate,
      description: e.description ?? e.category,
      value: toNumber(e.amount),
      method: null,
      status: null,
      details: {
        category: e.category,
        amount: toNumber(e.amount),
        notes: e.description,
      },
    })),
    ...goalRows.map((g): HistoryRecord => ({
      id: g.id,
      type: "goal",
      date: g.createdAt.toISOString(),
      description: `Meta: ${g.name}`,
      value: toNumber(g.targetAmount),
      method: null,
      status: g.status,
      details: {
        targetAmount: toNumber(g.targetAmount),
        currentAmount: toNumber(g.currentAmount),
        salePrice: toNumber(g.salePrice),
        unitCost: toNumber(g.unitCost),
        profitPerPiece: toNumber(g.profitPerPiece),
        piecesNeeded: g.piecesNeeded,
        deadline: g.deadline,
      },
    })),
  ];

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function deleteHistoryRecord(id: string, type: HistoryType): Promise<void> {
  switch (type) {
    case "importation":
      await db.delete(importations).where(eq(importations.id, id));
      break;
    case "sale":
      // Reutiliza deleteSale para restaurar estoque e recalcular a meta
      await deleteSale(id);
      break;
    case "expense":
      await db.delete(expenses).where(eq(expenses.id, id));
      break;
    case "goal":
      await db.delete(goals).where(eq(goals.id, id));
      break;
  }
}
