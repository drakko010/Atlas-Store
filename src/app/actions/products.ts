"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, type Product } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { calculateProductCost } from "@/features/produtos/cost";

export type ProductFormData = {
  name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  supplierId: string | null;
  country: string;
  importMethod: "uscloser" | "cssbuy" | "direct" | "other";
  purchasePrice: number;
  importCost: number;
  salePrice: number;
  quantity: number;
  image: string;
  notes: string;
};

export async function listProducts(): Promise<Product[]> {
  const userId = await getCurrentUserId();
  return db.select().from(products).where(eq(products.userId, userId)).orderBy(products.name);
}

export async function createProduct(data: ProductFormData): Promise<Product> {
  const userId = await getCurrentUserId();

  const cost = calculateProductCost({
    purchasePrice: data.purchasePrice,
    importCost: data.importCost,
    quantity: data.quantity,
  });

  const [product] = await db
    .insert(products)
    .values({
      userId,
      supplierId: data.supplierId,
      name: data.name,
      brand: data.brand || null,
      category: data.category || null,
      size: data.size || null,
      color: data.color || null,
      country: data.country || null,
      importMethod: data.importMethod,
      purchasePrice: String(data.purchasePrice),
      importCost: String(data.importCost),
      totalCost: String(cost.totalCost),
      unitCost: String(cost.costPerPiece),
      salePrice: String(data.salePrice),
      quantity: data.quantity,
      image: data.image || null,
      notes: data.notes || null,
    })
    .returning();

  return product;
}

export async function updateProduct(id: string, data: ProductFormData): Promise<Product> {
  const userId = await getCurrentUserId();

  const cost = calculateProductCost({
    purchasePrice: data.purchasePrice,
    importCost: data.importCost,
    quantity: data.quantity,
  });

  const [product] = await db
    .update(products)
    .set({
      supplierId: data.supplierId,
      name: data.name,
      brand: data.brand || null,
      category: data.category || null,
      size: data.size || null,
      color: data.color || null,
      country: data.country || null,
      importMethod: data.importMethod,
      purchasePrice: String(data.purchasePrice),
      importCost: String(data.importCost),
      totalCost: String(cost.totalCost),
      unitCost: String(cost.costPerPiece),
      salePrice: String(data.salePrice),
      quantity: data.quantity,
      image: data.image || null,
      notes: data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();

  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  await db.delete(products).where(eq(products.id, id));
}
