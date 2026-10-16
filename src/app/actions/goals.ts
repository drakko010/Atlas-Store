"use server";

import { and, eq, gte, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import { goals, sales, type Goal } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { getProfitSplit } from "@/app/actions/settings";
import { calculateGoalProjection } from "@/features/metas/goal-math";

export type GoalFormData = {
  name: string;
  targetAmount: number;
  salePrice: number;
  unitCost: number;
  deadline?: string;
};

export async function listGoals(): Promise<Goal[]> {
  const userId = await getCurrentUserId();
  return db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(sql`${goals.createdAt} desc`);
}

export async function getActiveGoal(): Promise<Goal | null> {
  const userId = await getCurrentUserId();
  const row = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, "active")))
    .orderBy(sql`${goals.createdAt} desc`)
    .limit(1)
    .then((rows) => rows[0] ?? null);
  return row;
}

export async function createGoal(data: GoalFormData): Promise<Goal> {
  const userId = await getCurrentUserId();
  const split = await getProfitSplit();

  const projection = calculateGoalProjection({
    targetAmount: data.targetAmount,
    salePrice: data.salePrice,
    unitCost: data.unitCost,
    availablePercentage: split.availablePercentage,
    reinvestmentPercentage: split.reinvestmentPercentage,
  });

  // Desativa metas ativas anteriores
  await db
    .update(goals)
    .set({ status: "completed" })
    .where(and(eq(goals.userId, userId), eq(goals.status, "active")));

  const [goal] = await db
    .insert(goals)
    .values({
      userId,
      name: data.name,
      targetAmount: String(data.targetAmount),
      currentAmount: "0",
      salePrice: String(data.salePrice),
      unitCost: String(data.unitCost),
      profitPerPiece: String(projection.availableProfitPerPiece),
      piecesNeeded: projection.piecesNeeded,
      deadline: data.deadline ?? null,
      status: "active",
    })
    .returning();

  return goal;
}

export async function updateGoalCurrentAmount(goalId: string): Promise<void> {
  const result = await db
    .select({ total: sum(sales.availableProfit) })
    .from(sales)
    .where(eq(sales.goalId, goalId))
    .then((rows) => rows[0]);

  const total = Number(result?.total ?? 0);

  await db
    .update(goals)
    .set({ currentAmount: String(total) })
    .where(eq(goals.id, goalId));
}

export async function completeGoal(id: string): Promise<void> {
  await db.update(goals).set({ status: "completed" }).where(eq(goals.id, id));
}

export async function deleteGoal(id: string): Promise<void> {
  await db.delete(goals).where(eq(goals.id, id));
}
