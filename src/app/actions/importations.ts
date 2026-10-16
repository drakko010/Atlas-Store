"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  importationEvents,
  importationItems,
  importations,
  products,
  stockMovements,
  type Importation,
  type ImportationEvent,
  type ImportationItem,
} from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { toNumber } from "@/lib/database";
import {
  calculateImportation,
  weightedUnitCost,
  type ImportationStatus,
  type ImportItemInput,
} from "@/features/importacoes/import-math";

export type ImportationItemInput = ImportItemInput;

export type ImportationFormData = {
  name: string;
  method: "uscloser" | "cssbuy";
  supplier: string;
  originCountry: string;
  currency: "USD" | "CNY";
  exchangeRate: number;
  importDate: string;
  status: ImportationStatus;
  shipping: number;
  fees: number;
  insurance: number;
  taxesBRL: number;
  otherBRL: number;
  notes: string;
  items: ImportationItemInput[];
};

export type ImportationWithItems = Importation & {
  items: (ImportationItem & { productName: string; brand: string | null })[];
  events: ImportationEvent[];
};

function validate(data: ImportationFormData): string | null {
  if (!data.name.trim()) return "Informe o nome da importação.";
  if (!data.method) return "Selecione o método de importação.";
  if (!(data.exchangeRate > 0)) return "A cotação deve ser maior que zero.";
  if (data.items.length === 0) return "Adicione pelo menos um produto.";
  for (const item of data.items) {
    if (!(item.quantity > 0)) return "Quantidade deve ser maior que zero.";
    if (item.unitPrice < 0) return "Preços não podem ser negativos.";
    if (item.unitWeight < 0) return "Peso não pode ser negativo.";
  }
  if (data.shipping < 0 || data.fees < 0 || data.insurance < 0) return "Custos não podem ser negativos.";
  if (data.taxesBRL < 0 || data.otherBRL < 0) return "Impostos e outros custos não podem ser negativos.";
  return null;
}

export async function listImportations(): Promise<ImportationWithItems[]> {
  const userId = await getCurrentUserId();

  const rows = await db
    .select()
    .from(importations)
    .where(and(eq(importations.userId, userId), eq(importations.archived, false)))
    .orderBy(sql`${importations.importDate} desc, ${importations.createdAt} desc`);

  const ids = rows.map((r) => r.id);
  const [items, events] =
    ids.length > 0
      ? await Promise.all([
          db
            .select({
              id: importationItems.id,
              importationId: importationItems.importationId,
              productId: importationItems.productId,
              quantity: importationItems.quantity,
              unitPrice: importationItems.unitPrice,
              unitWeight: importationItems.unitWeight,
              unitCost: importationItems.unitCost,
              lineTotalCost: importationItems.lineTotalCost,
              createdAt: importationItems.createdAt,
              productName: products.name,
              brand: products.brand,
            })
            .from(importationItems)
            .innerJoin(products, eq(importationItems.productId, products.id))
            .where(sql`${importationItems.importationId} = ANY(${ids})`),
          db
            .select()
            .from(importationEvents)
            .where(sql`${importationEvents.importationId} = ANY(${ids})`)
            .orderBy(importationEvents.createdAt),
        ])
      : [[], []];

  return rows.map((row) => ({
    ...row,
    items: items.filter((i) => i.importationId === row.id),
    events: events.filter((e) => e.importationId === row.id),
  }));
}

export async function getImportation(id: string): Promise<ImportationWithItems | null> {
  const userId = await getCurrentUserId();
  const row = await db
    .select()
    .from(importations)
    .where(and(eq(importations.id, id), eq(importations.userId, userId)))
    .then((rows) => rows[0] ?? null);
  if (!row) return null;

  const [items, events] = await Promise.all([
    db
      .select({
        id: importationItems.id,
        importationId: importationItems.importationId,
        productId: importationItems.productId,
        quantity: importationItems.quantity,
        unitPrice: importationItems.unitPrice,
        unitWeight: importationItems.unitWeight,
        unitCost: importationItems.unitCost,
        lineTotalCost: importationItems.lineTotalCost,
        createdAt: importationItems.createdAt,
        productName: products.name,
        brand: products.brand,
      })
      .from(importationItems)
      .innerJoin(products, eq(importationItems.productId, products.id))
      .where(eq(importationItems.importationId, id)),
    db
      .select()
      .from(importationEvents)
      .where(eq(importationEvents.importationId, id))
      .orderBy(importationEvents.createdAt),
  ]);

  return { ...row, items, events };
}

export async function getImportationsSummary() {
  const userId = await getCurrentUserId();
  const rows = await db
    .select({
      status: importations.status,
      totalCost: importations.totalCost,
      archived: importations.archived,
    })
    .from(importations)
    .where(eq(importations.userId, userId));

  const items = await db
    .select({ quantity: importationItems.quantity })
    .from(importationItems)
    .innerJoin(importations, eq(importationItems.importationId, importations.id))
    .where(eq(importations.userId, userId));

  const active = rows.filter((r) => !r.archived);
  return {
    total: active.length,
    inProgress: active.filter((r) => !["received", "completed", "cancelled"].includes(r.status)).length,
    importedValue: active.reduce((s, r) => s + toNumber(r.totalCost), 0),
    importedPieces: items.reduce((s, i) => s + i.quantity, 0),
  };
}

async function writeItems(importationId: string, data: ImportationFormData, rate: number) {
  await db.delete(importationItems).where(eq(importationItems.importationId, importationId));

  const { items } = calculateImportation(
    data.items,
    {
      exchangeRate: rate,
      shipping: data.shipping,
      fees: data.fees,
      insurance: data.insurance,
      taxesBRL: data.taxesBRL,
      otherBRL: data.otherBRL,
    },
  );

  for (const item of items) {
    await db.insert(importationItems).values({
      importationId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      unitWeight: String(item.unitWeight),
      unitCost: String(item.unitCostBRL),
      lineTotalCost: String(item.finalCostBRL),
    });
  }

  return items;
}

export async function createImportation(
  data: ImportationFormData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const error = validate(data);
  if (error) return { ok: false, error };

  const userId = await getCurrentUserId();
  const { totals } = calculateImportation(data.items, {
    exchangeRate: data.exchangeRate,
    shipping: data.shipping,
    fees: data.fees,
    insurance: data.insurance,
    taxesBRL: data.taxesBRL,
    otherBRL: data.otherBRL,
  });

  const [row] = await db
    .insert(importations)
    .values({
      userId,
      name: data.name,
      method: data.method,
      supplier: data.supplier || null,
      originCountry: data.originCountry || null,
      currency: data.currency,
      exchangeRate: String(data.exchangeRate),
      productTotal: String(totals.productForeign),
      shippingCost: String(totals.shippingForeign),
      fees: String(totals.feesForeign),
      insurance: String(totals.insuranceForeign),
      taxes: String(data.taxesBRL),
      otherCosts: String(data.otherBRL),
      totalCost: String(totals.totalBRL),
      status: data.status,
      importDate: data.importDate || new Date().toISOString().slice(0, 10),
      notes: data.notes || null,
    })
    .returning();

  await writeItems(row.id, data, data.exchangeRate);

  await db.insert(importationEvents).values({
    importationId: row.id,
    status: data.status,
    note: "Importação criada.",
  });

  return { ok: true, id: row.id };
}

export async function updateImportation(
  id: string,
  data: ImportationFormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const error = validate(data);
  if (error) return { ok: false, error };

  const userId = await getCurrentUserId();
  const { totals } = calculateImportation(data.items, {
    exchangeRate: data.exchangeRate,
    shipping: data.shipping,
    fees: data.fees,
    insurance: data.insurance,
    taxesBRL: data.taxesBRL,
    otherBRL: data.otherBRL,
  });

  const updated = await db
    .update(importations)
    .set({
      name: data.name,
      method: data.method,
      supplier: data.supplier || null,
      originCountry: data.originCountry || null,
      currency: data.currency,
      exchangeRate: String(data.exchangeRate),
      productTotal: String(totals.productForeign),
      shippingCost: String(totals.shippingForeign),
      fees: String(totals.feesForeign),
      insurance: String(totals.insuranceForeign),
      taxes: String(data.taxesBRL),
      otherCosts: String(data.otherBRL),
      totalCost: String(totals.totalBRL),
      importDate: data.importDate,
      notes: data.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(importations.id, id), eq(importations.userId, userId)))
    .returning();

  if (updated.length === 0) return { ok: false, error: "Importação não encontrada." };

  await writeItems(id, data, data.exchangeRate);

  await db.insert(importationEvents).values({
    importationId: id,
    note: "Importação editada.",
  });

  return { ok: true };
}

export async function updateImportationStatus(
  id: string,
  status: ImportationStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await getCurrentUserId();
  const updated = await db
    .update(importations)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(importations.id, id), eq(importations.userId, userId)))
    .returning();

  if (updated.length === 0) return { ok: false, error: "Importação não encontrada." };

  await db.insert(importationEvents).values({
    importationId: id,
    status,
    note: `Status alterado.`,
  });

  return { ok: true };
}

export async function duplicateImportation(id: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const existing = await getImportation(id);
  if (!existing) return { ok: false, error: "Importação não encontrada." };

  const userId = await getCurrentUserId();
  const [row] = await db
    .insert(importations)
    .values({
      userId,
      name: `${existing.name} (cópia)`,
      method: existing.method,
      supplier: existing.supplier,
      originCountry: existing.originCountry,
      currency: existing.currency,
      exchangeRate: existing.exchangeRate,
      productTotal: existing.productTotal,
      shippingCost: existing.shippingCost,
      fees: existing.fees,
      insurance: existing.insurance,
      taxes: existing.taxes,
      otherCosts: existing.otherCosts,
      totalCost: existing.totalCost,
      status: "budget",
      importDate: new Date().toISOString().slice(0, 10),
      notes: existing.notes,
    })
    .returning();

  for (const item of existing.items) {
    await db.insert(importationItems).values({
      importationId: row.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unitWeight: item.unitWeight,
      unitCost: item.unitCost,
      lineTotalCost: item.lineTotalCost,
    });
  }

  await db.insert(importationEvents).values({
    importationId: row.id,
    status: "budget",
    note: `Duplicada de "${existing.name}".`,
  });

  return { ok: true, id: row.id };
}

export async function deleteImportation(
  id: string,
): Promise<{ ok: true; archived: boolean } | { ok: false; error: string }> {
  const userId = await getCurrentUserId();
  const row = await db
    .select({ stockAdded: importations.stockAdded })
    .from(importations)
    .where(and(eq(importations.id, id), eq(importations.userId, userId)))
    .then((rows) => rows[0] ?? null);

  if (!row) return { ok: false, error: "Importação não encontrada." };

  // Com movimentação de estoque → arquiva para preservar o histórico.
  if (row.stockAdded) {
    await db
      .update(importations)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(importations.id, id));
    await db.insert(importationEvents).values({
      importationId: id,
      note: "Importação arquivada (possui movimentação de estoque).",
    });
    return { ok: true, archived: true };
  }

  await db.delete(importations).where(eq(importations.id, id));
  return { ok: true, archived: false };
}

/**
 * Entrada no estoque com proteção contra duplicidade.
 * Atualiza quantidade e custo médio ponderado do produto.
 */
export async function addImportationToStock(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await getCurrentUserId();
  const imp = await getImportation(id);
  if (!imp) return { ok: false, error: "Importação não encontrada." };

  if (imp.stockAdded) {
    return { ok: false, error: "Estoque já foi atualizado para esta importação." };
  }
  if (!canReceive(imp.status)) {
    return { ok: false, error: "Somente importações Recebidas ou Finalizadas entram no estoque." };
  }

  const { items } = calculateImportation(
    imp.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: toNumber(i.unitPrice),
      unitWeight: toNumber(i.unitWeight),
    })),
    {
      exchangeRate: toNumber(imp.exchangeRate),
      shipping: toNumber(imp.shippingCost),
      fees: toNumber(imp.fees),
      insurance: toNumber(imp.insurance),
      taxesBRL: toNumber(imp.taxes),
      otherBRL: toNumber(imp.otherCosts),
    },
  );

  await db.transaction(async (tx) => {
    for (const item of items) {
      const product = await tx
        .select({ quantity: products.quantity, unitCost: products.unitCost })
        .from(products)
        .where(eq(products.id, item.productId))
        .then((rows) => rows[0]);
      if (!product) continue;

      const currentQty = product.quantity;
      const currentUnit = toNumber(product.unitCost);
      const newUnit = weightedUnitCost(currentQty, currentUnit, item.quantity, item.unitCostBRL);

      await tx
        .update(products)
        .set({
          quantity: sql`${products.quantity} + ${item.quantity}`,
          unitCost: String(newUnit),
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));

      await tx.insert(stockMovements).values({
        userId,
        productId: item.productId,
        importationId: id,
        quantity: item.quantity,
        unitCost: String(item.unitCostBRL),
      });
    }

    await tx
      .update(importations)
      .set({ stockAdded: true, updatedAt: new Date() })
      .where(eq(importations.id, id));

    await tx.insert(importationEvents).values({
      importationId: id,
      note: "Produtos adicionados ao estoque.",
    });
  });

  return { ok: true };
}

function canReceive(status: string): boolean {
  return status === "received" || status === "completed";
}

/** Cria importação a partir das calculadoras (USCloser / CSSBuy). */
export async function createImportationFromCalculator(payload: {
  method: "uscloser" | "cssbuy";
  name: string;
  currency: "USD" | "CNY";
  exchangeRate: number;
  productTotal: number;
  shipping: number;
  fees: number;
  insurance: number;
  taxesBRL: number;
  otherBRL: number;
  totalBRL: number;
  productId: string | null;
  quantity: number;
  unitPrice: number;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const userId = await getCurrentUserId();

  const [row] = await db
    .insert(importations)
    .values({
      userId,
      name: payload.name,
      method: payload.method,
      originCountry: payload.method === "uscloser" ? "Estados Unidos" : "China",
      currency: payload.currency,
      exchangeRate: String(payload.exchangeRate),
      productTotal: String(payload.productTotal),
      shippingCost: String(payload.shipping),
      fees: String(payload.fees),
      insurance: String(payload.insurance),
      taxes: String(payload.taxesBRL),
      otherCosts: String(payload.otherBRL),
      totalCost: String(payload.totalBRL),
      status: "budget",
      importDate: new Date().toISOString().slice(0, 10),
      notes: "Criada a partir da calculadora.",
    })
    .returning();

  if (payload.productId) {
    const { items } = calculateImportation(
      [
        {
          productId: payload.productId,
          quantity: Math.max(payload.quantity, 1),
          unitPrice: payload.unitPrice,
          unitWeight: 0,
        },
      ],
      {
        exchangeRate: payload.exchangeRate,
        shipping: payload.shipping,
        fees: payload.fees,
        insurance: payload.insurance,
        taxesBRL: payload.taxesBRL,
        otherBRL: payload.otherBRL,
      },
    );
    for (const item of items) {
      await db.insert(importationItems).values({
        importationId: row.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        unitWeight: "0",
        unitCost: String(item.unitCostBRL),
        lineTotalCost: String(item.finalCostBRL),
      });
    }
  }

  await db.insert(importationEvents).values({
    importationId: row.id,
    status: "budget",
    note: "Criada a partir da calculadora.",
  });

  return { ok: true, id: row.id };
}
