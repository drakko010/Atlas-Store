/**
 * Camada temporária de autenticação.
 * Enquanto não implementamos login real, garantimos um usuário padrão
 * para isolar dados no banco e permitir testes.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, users } from "@/db/schema";

const DEFAULT_EMAIL = "admin@atlasstore.local";

export async function getCurrentUserId(): Promise<string> {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEFAULT_EMAIL));

  if (existing) return existing.id;

  const [user] = await db
    .insert(users)
    .values({ email: DEFAULT_EMAIL, name: "Atlas Admin" })
    .returning({ id: users.id });

  await db.insert(settings).values({
    userId: user.id,
    reinvestmentPercentage: "50",
    availableProfitPercentage: "50",
    usdRate: "5",
    cnyRate: "0.7",
    importTax: "60",
    icms: "17",
    paymentFee: "0",
    otherFees: "0",
  });

  return user.id;
}
