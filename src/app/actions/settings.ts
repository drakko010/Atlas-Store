"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getCurrentUserId } from "@/lib/auth";
import { toNumber } from "@/lib/database";

export type UsCloserSettings = {
  commercialRate: number;
  importTax: number;
  icms: number;
  otherFees: number;
};

export type CSSBuySettings = {
  yuanRate: number;
  taxRate: number;
  otherFees: number;
};

export async function getUsCloserSettings(): Promise<UsCloserSettings> {
  const userId = await getCurrentUserId();

  const row = await db
    .select({
      usdRate: settings.usdRate,
      importTax: settings.importTax,
      icms: settings.icms,
      otherFees: settings.otherFees,
    })
    .from(settings)
    .where(eq(settings.userId, userId))
    .then((rows) => rows[0] ?? null);

  return {
    commercialRate: toNumber(row?.usdRate ?? 5),
    importTax: toNumber(row?.importTax ?? 60),
    icms: toNumber(row?.icms ?? 17),
    otherFees: toNumber(row?.otherFees ?? 0),
  };
}

export async function getCSSBuySettings(): Promise<CSSBuySettings> {
  const userId = await getCurrentUserId();

  const row = await db
    .select({
      cnyRate: settings.cnyRate,
      importTax: settings.importTax,
      otherFees: settings.otherFees,
    })
    .from(settings)
    .where(eq(settings.userId, userId))
    .then((rows) => rows[0] ?? null);

  return {
    yuanRate: toNumber(row?.cnyRate ?? 0.7),
    taxRate: toNumber(row?.importTax ?? 60),
    otherFees: toNumber(row?.otherFees ?? 0),
  };
}

export type ProfitSplit = {
  availablePercentage: number;
  reinvestmentPercentage: number;
};

export type FullSettings = {
  availableProfitPercentage: number;
  reinvestmentPercentage: number;
  usdRate: number;
  cnyRate: number;
  importTax: number;
  icms: number;
  otherFees: number;
  paymentFee: number;
  saleOtherCosts: number;
};

export type SettingsUpdateData = Partial<FullSettings>;

export async function getProfitSplit(): Promise<ProfitSplit> {
  const userId = await getCurrentUserId();

  const row = await db
    .select({
      availableProfitPercentage: settings.availableProfitPercentage,
      reinvestmentPercentage: settings.reinvestmentPercentage,
    })
    .from(settings)
    .where(eq(settings.userId, userId))
    .then((rows) => rows[0] ?? null);

  return {
    availablePercentage: toNumber(row?.availableProfitPercentage ?? 50),
    reinvestmentPercentage: toNumber(row?.reinvestmentPercentage ?? 50),
  };
}

export async function getFullSettings(): Promise<FullSettings> {
  const userId = await getCurrentUserId();

  const row = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .then((rows) => rows[0] ?? null);

  if (!row) {
    return {
      availableProfitPercentage: 50,
      reinvestmentPercentage: 50,
      usdRate: 5,
      cnyRate: 0.7,
      importTax: 60,
      icms: 17,
      otherFees: 0,
      paymentFee: 0,
      saleOtherCosts: 0,
    };
  }

  return {
    availableProfitPercentage: toNumber(row.availableProfitPercentage),
    reinvestmentPercentage: toNumber(row.reinvestmentPercentage),
    usdRate: toNumber(row.usdRate),
    cnyRate: toNumber(row.cnyRate),
    importTax: toNumber(row.importTax),
    icms: toNumber(row.icms),
    otherFees: toNumber(row.otherFees),
    paymentFee: toNumber(row.paymentFee),
    saleOtherCosts: toNumber(row.saleOtherCosts),
  };
}

export async function updateSettings(data: SettingsUpdateData): Promise<void> {
  const userId = await getCurrentUserId();

  await db
    .update(settings)
    .set({
      ...(data.availableProfitPercentage !== undefined && {
        availableProfitPercentage: String(data.availableProfitPercentage),
      }),
      ...(data.reinvestmentPercentage !== undefined && {
        reinvestmentPercentage: String(data.reinvestmentPercentage),
      }),
      ...(data.usdRate !== undefined && { usdRate: String(data.usdRate) }),
      ...(data.cnyRate !== undefined && { cnyRate: String(data.cnyRate) }),
      ...(data.importTax !== undefined && { importTax: String(data.importTax) }),
      ...(data.icms !== undefined && { icms: String(data.icms) }),
      ...(data.otherFees !== undefined && { otherFees: String(data.otherFees) }),
      ...(data.paymentFee !== undefined && { paymentFee: String(data.paymentFee) }),
      ...(data.saleOtherCosts !== undefined && { saleOtherCosts: String(data.saleOtherCosts) }),
      updatedAt: new Date(),
    })
    .where(eq(settings.userId, userId));
}
