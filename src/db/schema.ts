import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  date,
  boolean,
  foreignKey,
  unique,
} from "drizzle-orm/pg-core";

// ============================================================
// Enums
// ============================================================

export const importMethodEnum = pgEnum("import_method", [
  "uscloser",
  "cssbuy",
  "direct",
  "other",
]);

export const importationStatusEnum = pgEnum("importation_status", [
  "pending",
  "budget",
  "awaiting_payment",
  "purchased",
  "preparing",
  "shipped",
  "in_transit",
  "arrived_brazil",
  "customs",
  "received",
  "completed",
  "cancelled",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "cancelled",
]);

export const currencyEnum = pgEnum("currency", ["BRL", "USD", "CNY"]);

export const saleChannelEnum = pgEnum("sale_channel", [
  "instagram",
  "whatsapp",
  "website",
  "marketplace",
  "store",
  "other",
]);

// ============================================================
// Users
// ============================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Suppliers
// ============================================================

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Products
// ============================================================

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  category: varchar("category", { length: 100 }),
  size: varchar("size", { length: 50 }),
  color: varchar("color", { length: 50 }),
  country: varchar("country", { length: 100 }),
  importMethod: importMethodEnum("import_method"),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }).default("0").notNull(),
  importCost: decimal("import_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Custo médio por peça (total_cost ÷ quantidade inicial). */
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }).default("0").notNull(),
  quantity: integer("quantity").default(0).notNull(),
  image: text("image"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Importations
// ============================================================

export const importations = pgTable("importations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Nome da importação, ex.: "Importação Nike Setembro". */
  name: varchar("name", { length: 255 }).notNull().default("Importação"),
  method: importMethodEnum("method").notNull(),
  supplier: varchar("supplier", { length: 255 }),
  originCountry: varchar("origin_country", { length: 100 }),
  currency: currencyEnum("currency").default("USD").notNull(),
  /** Câmbio congelado no momento da importação — nunca recalculado depois. */
  exchangeRate: decimal("exchange_rate", { precision: 12, scale: 4 }).default("1").notNull(),
  /** Valor dos produtos na moeda da importação (USD/CNY). */
  productTotal: decimal("product_total", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Frete na moeda da importação. */
  shippingCost: decimal("shipping_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Impostos em BRL. */
  taxes: decimal("taxes", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Taxas na moeda da importação. */
  fees: decimal("fees", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Seguro na moeda da importação. */
  insurance: decimal("insurance", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Outros custos em BRL. */
  otherCosts: decimal("other_costs", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Custo total da importação em BRL. */
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  status: importationStatusEnum("status").default("budget").notNull(),
  /** Proteção contra entrada duplicada no estoque. */
  stockAdded: boolean("stock_added").notNull().default(false),
  /** Importações com movimentação são arquivadas em vez de apagadas. */
  archived: boolean("archived").notNull().default(false),
  importDate: date("import_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Importation Items
// ============================================================

export const importationItems = pgTable(
  "importation_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    importationId: uuid("importation_id")
      .notNull()
      .references(() => importations.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").default(1).notNull(),
    /** Preço unitário na moeda da importação. */
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).default("0").notNull(),
    /** Peso unitário em kg. */
    unitWeight: decimal("unit_weight", { precision: 12, scale: 3 }).default("0").notNull(),
    unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).default("0").notNull(),
    lineTotalCost: decimal("line_total_cost", { precision: 12, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("unique_import_product").on(table.importationId, table.productId)],
);

// ============================================================
// Importation Events (timeline / histórico da importação)
// ============================================================

export const importationEvents = pgTable("importation_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  importationId: uuid("importation_id")
    .notNull()
    .references(() => importations.id, { onDelete: "cascade" }),
  status: importationStatusEnum("status"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Stock Movements (entradas de estoque por importação)
// ============================================================

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  importationId: uuid("importation_id")
    .notNull()
    .references(() => importations.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Sales
// ============================================================

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
  channel: saleChannelEnum("channel").default("other"),
  quantity: integer("quantity").default(1).notNull(),
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }).default("0").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  grossProfit: decimal("gross_profit", { precision: 12, scale: 2 }).default("0").notNull(),
  availableProfit: decimal("available_profit", { precision: 12, scale: 2 }).default("0").notNull(),
  reinvestmentProfit: decimal("reinvestment_profit", { precision: 12, scale: 2 }).default("0").notNull(),
  paymentFee: decimal("payment_fee", { precision: 12, scale: 2 }).default("0").notNull(),
  otherCosts: decimal("other_costs", { precision: 12, scale: 2 }).default("0").notNull(),
  saleDate: date("sale_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Sale Items
// ============================================================

export const saleItems = pgTable(
  "sale_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").default(1).notNull(),
    unitSalePrice: decimal("unit_sale_price", { precision: 12, scale: 2 }).default("0").notNull(),
    unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).default("0").notNull(),
    lineRevenue: decimal("line_revenue", { precision: 12, scale: 2 }).default("0").notNull(),
    lineCost: decimal("line_cost", { precision: 12, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("unique_sale_product").on(table.saleId, table.productId)],
);

// ============================================================
// Goals
// ============================================================

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Preço de venda médio usado para projeção da meta. */
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Custo unitário médio usado para projeção da meta. */
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Lucro disponível por peça (calculado). */
  profitPerPiece: decimal("profit_per_piece", { precision: 12, scale: 2 }).default("0").notNull(),
  /** Quantidade de peças necessárias para atingir a meta (calculado). */
  piecesNeeded: integer("pieces_needed").default(0).notNull(),
  deadline: date("deadline"),
  status: goalStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Expenses
// ============================================================

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  expenseDate: date("expense_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Currency Rates
// ============================================================

export const currencyRates = pgTable(
  "currency_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currency: currencyEnum("currency").notNull(),
    rate: decimal("rate", { precision: 12, scale: 4 }).default("1").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("unique_user_currency").on(table.userId, table.currency)],
);

// ============================================================
// Settings
// ============================================================

export const settings = pgTable(
  "settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reinvestmentPercentage: decimal("reinvestment_percentage", { precision: 5, scale: 2 })
      .default("50")
      .notNull(),
    availableProfitPercentage: decimal("available_profit_percentage", { precision: 5, scale: 2 })
      .default("50")
      .notNull(),
    usdRate: decimal("usd_rate", { precision: 12, scale: 4 }).default("5").notNull(),
    cnyRate: decimal("cny_rate", { precision: 12, scale: 4 }).default("0.7").notNull(),
    importTax: decimal("import_tax", { precision: 5, scale: 2 }).default("60").notNull(),
    icms: decimal("icms", { precision: 5, scale: 2 }).default("17").notNull(),
  paymentFee: decimal("payment_fee", { precision: 5, scale: 2 }).default("0").notNull(),
  otherFees: decimal("other_fees", { precision: 12, scale: 2 }).default("0").notNull(),
  saleOtherCosts: decimal("sale_other_costs", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("unique_user_settings").on(table.userId)],
);

// ============================================================
// Type helpers
// ============================================================

export type User = typeof users.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Importation = typeof importations.$inferSelect;
export type ImportationItem = typeof importationItems.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type CurrencyRate = typeof currencyRates.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type ImportationEvent = typeof importationEvents.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;

export type NewUser = typeof users.$inferInsert;
export type NewSupplier = typeof suppliers.$inferInsert;
export type NewProduct = typeof products.$inferInsert;
export type NewImportation = typeof importations.$inferInsert;
export type NewImportationItem = typeof importationItems.$inferInsert;
export type NewSale = typeof sales.$inferInsert;
export type NewSaleItem = typeof saleItems.$inferInsert;
export type NewGoal = typeof goals.$inferInsert;
export type NewExpense = typeof expenses.$inferInsert;
export type NewCurrencyRate = typeof currencyRates.$inferInsert;
export type NewSettings = typeof settings.$inferInsert;
