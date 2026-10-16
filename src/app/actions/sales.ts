"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, sales, type Sale } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { calculateSale } from "@/features/vendas/sale-math";
import { getProfitSplit } from "@/app/actions/settings";
import { getActiveGoal, updateGoalCurrentAmount } from "@/app/actions/goals";

export type SaleFormData = {
  productId: string;
  quantity: number;
  salePrice: number;
  paymentFee: number;
  otherCosts: number;
  saleDate: string;
  notes?: string;
};

export async function listSales(): Promise<Sale[]> {
  const userId = await getCurrentUserId();
  return db
    .select()
    .from(sales)
    .where(eq(sales.userId, userId))
    .orderBy(sales.saleDate);
}

export async function listProductsForSale(): Promise<
  { id: string; name: string; totalCost: string; unitCost: string; salePrice: string; quantity: number }[]
> {
  const userId = await getCurrentUserId();
  return db
    .select({
      id: products.id,
      name: products.name,
      totalCost: products.totalCost,
      unitCost: products.unitCost,
      salePrice: products.salePrice,
      quantity: products.quantity,
    })
    .from(products)
    .where(eq(products.userId, userId))
    .orderBy(products.name);
}

export async function createSale(data: SaleFormData): Promise<Sale> {
  const userId = await getCurrentUserId();

  const product = await db
    .select({
      totalCost: products.totalCost,
      unitCost: products.unitCost,
      quantity: products.quantity,
    })
    .from(products)
    .where(eq(products.id, data.productId))
    .then((rows) => rows[0]);

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  if (product.quantity < data.quantity) {
    throw new Error("Quantidade indisponível em estoque");
  }

  // Custo por peça: prefere unit_cost; como fallback, total do lote ÷ quantidade.
  const unitCost =
    Number(product.unitCost) > 0
      ? Number(product.unitCost)
      : Number(product.totalCost) / Math.max(product.quantity, 1);

  const split = await getProfitSplit();

  const result = calculateSale(
    {
      salePrice: data.salePrice,
      quantity: data.quantity,
      unitCost,
      paymentFee: data.paymentFee,
      otherCosts: data.otherCosts,
    },
    split,
  );

  const activeGoal = await getActiveGoal();

  const [sale] = await db
    .insert(sales)
    .values({
      userId,
      productId: data.productId,
      goalId: activeGoal?.id ?? null,
      quantity: data.quantity,
      salePrice: String(data.salePrice),
      paymentFee: String(data.paymentFee),
      otherCosts: String(data.otherCosts),
      totalRevenue: String(result.totalRevenue),
      totalCost: String(result.totalCost),
      grossProfit: String(result.grossProfit),
      availableProfit: String(result.availableProfit),
      reinvestmentProfit: String(result.reinvestmentProfit),
      saleDate: data.saleDate,
      notes: data.notes ?? null,
    })
    .returning();

  if (activeGoal) {
    await updateGoalCurrentAmount(activeGoal.id);
  }

  // Atualiza estoque
  await db
    .update(products)
    .set({
      quantity: sql`${products.quantity} - ${data.quantity}`,
    })
    .where(eq(products.id, data.productId));

  return sale;
}

export async function deleteSale(id: string): Promise<void> {
  const sale = await db
    .select()
    .from(sales)
    .where(eq(sales.id, id))
    .then((rows) => rows[0]);

  if (!sale) return;

  await db.delete(sales).where(eq(sales.id, id));

  // Restaura o estoque do produto
  await db
    .update(products)
    .set({ quantity: sql`${products.quantity} + ${sale.quantity}` })
    .where(eq(products.id, sale.productId));

  // Recalcula o progresso da meta vinculada
  if (sale.goalId) {
    await updateGoalCurrentAmount(sale.goalId);
  }
}
