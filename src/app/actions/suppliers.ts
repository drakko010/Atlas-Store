"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";

export async function listSuppliers() {
  const userId = await getCurrentUserId();
  return db
    .select({ id: suppliers.id, name: suppliers.name })
    .from(suppliers)
    .where(eq(suppliers.userId, userId))
    .orderBy(suppliers.name);
}
