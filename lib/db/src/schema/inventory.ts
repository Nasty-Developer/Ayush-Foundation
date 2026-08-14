import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const inventoryFilesTable = pgTable(
  "inventory_files",
  {
    id: serial("id").primaryKey(),
    fileType: text("file_type").notNull(),
    fileName: text("file_name").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sourceHash: text("source_hash").notNull(),
    detectionStatus: text("detection_status").notNull().default("pending"),
    uploadStatus: text("upload_status").notNull().default("uploaded"),
    parsingStatus: text("parsing_status").notNull().default("pending"),
    recordCount: integer("record_count"),
    validCount: integer("valid_count"),
    invalidCount: integer("invalid_count"),
    warningCount: integer("warning_count"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    currentSyncStatus: text("current_sync_status").notNull().default("not_synced"),
    ...timestamps,
  },
  (table) => ({
    sourceHashUnique: uniqueIndex("inventory_files_source_hash_unique").on(
      table.fileType,
      table.sourceHash,
    ),
    typeIndex: index("inventory_files_type_idx").on(table.fileType),
  }),
);

export const importRunsTable = pgTable(
  "inventory_import_runs",
  {
    id: serial("id").primaryKey(),
    status: text("status").notNull().default("uploaded"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    totalRecords: integer("total_records").notNull().default(0),
    importedRecords: integer("imported_records").notNull().default(0),
    updatedRecords: integer("updated_records").notNull().default(0),
    unchangedRecords: integer("unchanged_records").notNull().default(0),
    skippedRecords: integer("skipped_records").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    warningCount: integer("warning_count").notNull().default(0),
    errorMessage: text("error_message"),
    ...timestamps,
  },
  (table) => ({
    statusIndex: index("inventory_import_runs_status_idx").on(table.status),
  }),
);

export const importRunFilesTable = pgTable(
  "inventory_import_run_files",
  {
    id: serial("id").primaryKey(),
    runId: integer("run_id")
      .notNull()
      .references(() => importRunsTable.id, { onDelete: "cascade" }),
    fileId: integer("file_id")
      .notNull()
      .references(() => inventoryFilesTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    runFileUnique: uniqueIndex("inventory_import_run_files_unique").on(
      table.runId,
      table.fileId,
    ),
  }),
);

export const categoriesTable = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id").notNull(),
    sourceName: text("source_name").notNull(),
    displayName: text("display_name"),
    sourceType: text("source_type"),
    rawSource: jsonb("raw_source").$type<Record<string, string>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    sourceUnique: uniqueIndex("categories_source_unique").on(table.sourceId),
    nameIndex: index("categories_name_idx").on(table.sourceName),
  }),
);

export const companiesTable = pgTable(
  "companies",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id").notNull(),
    sourceName: text("source_name").notNull(),
    displayName: text("display_name"),
    rawSource: jsonb("raw_source").$type<Record<string, string>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    sourceUnique: uniqueIndex("companies_source_unique").on(table.sourceId),
    nameIndex: index("companies_name_idx").on(table.sourceName),
  }),
);

export const drugsTable = pgTable(
  "drugs",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id").notNull(),
    sourceName: text("source_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    strength: text("strength"),
    rawSource: jsonb("raw_source").$type<Record<string, string>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    sourceUnique: uniqueIndex("drugs_source_unique").on(table.sourceId),
    searchIndex: index("drugs_search_idx").on(table.normalizedName),
  }),
);

export const productsTable = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id").notNull(),
    sourceName: text("source_name").notNull(),
    normalizedSearchName: text("normalized_search_name").notNull(),
    localDisplayName: text("local_display_name"),
    categoryId: integer("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    companyId: integer("company_id").references(() => companiesTable.id, {
      onDelete: "set null",
    }),
    drugId: integer("drug_id").references(() => drugsTable.id, {
      onDelete: "set null",
    }),
    productType: text("product_type").notNull().default("general"),
    packForm: text("pack_form"),
    sourceCategory: text("source_category"),
    localCategoryOverride: text("local_category_override"),
    localBrandDisplayName: text("local_brand_display_name"),
    imageUrl: text("image_url"),
    cloudinaryPublicId: text("cloudinary_public_id"),
    rawSource: jsonb("raw_source").$type<Record<string, string>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    removedFromSourceAt: timestamp("removed_from_source_at", { withTimezone: true }),
    newArrival: boolean("new_arrival").notNull().default(false),
    specialMedicine: boolean("special_medicine").notNull().default(false),
    ...timestamps,
  },
  (table) => ({
    sourceUnique: uniqueIndex("products_source_unique").on(table.sourceId),
    searchIndex: index("products_search_idx").on(table.normalizedSearchName),
    categoryIndex: index("products_category_idx").on(table.categoryId),
    companyIndex: index("products_company_idx").on(table.companyId),
    typeIndex: index("products_type_idx").on(table.productType),
  }),
);

export const stockBatchesTable = pgTable(
  "stock_batches",
  {
    id: serial("id").primaryKey(),
    sourceId: text("source_id").notNull(),
    productId: integer("product_id")
      .notNull()
      .references(() => productsTable.id, { onDelete: "cascade" }),
    batchNumber: text("batch_number"),
    expiryDate: date("expiry_date", { mode: "string" }),
    quantity: numeric("quantity", { precision: 14, scale: 3 }),
    mrp: numeric("mrp", { precision: 14, scale: 2 }),
    salePrice: numeric("sale_price", { precision: 14, scale: 2 }),
    rawSource: jsonb("raw_source").$type<Record<string, string>>().notNull().default({}),
    ...timestamps,
  },
  (table) => ({
    sourceUnique: uniqueIndex("stock_batches_source_unique").on(table.sourceId),
    productIndex: index("stock_batches_product_idx").on(table.productId),
  }),
);

export const importErrorsTable = pgTable(
  "inventory_import_errors",
  {
    id: serial("id").primaryKey(),
    runId: integer("run_id")
      .notNull()
      .references(() => importRunsTable.id, { onDelete: "cascade" }),
    fileId: integer("file_id").references(() => inventoryFilesTable.id, {
      onDelete: "set null",
    }),
    lineNumber: integer("line_number"),
    sourceId: text("source_id"),
    reason: text("reason").notNull(),
    rawRecord: text("raw_record"),
    ...timestamps,
  },
  (table) => ({
    runIndex: index("inventory_import_errors_run_idx").on(table.runId),
  }),
);

export const insertInventoryFileSchema = createInsertSchema(inventoryFilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertImportRunSchema = createInsertSchema(importRunsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCompanySchema = createInsertSchema(companiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDrugSchema = createInsertSchema(drugsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertStockBatchSchema = createInsertSchema(stockBatchesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InventoryFile = typeof inventoryFilesTable.$inferSelect;
export type ImportRun = typeof importRunsTable.$inferSelect;
export type Category = typeof categoriesTable.$inferSelect;
export type Company = typeof companiesTable.$inferSelect;
export type Drug = typeof drugsTable.$inferSelect;
export type Product = typeof productsTable.$inferSelect;
export type StockBatch = typeof stockBatchesTable.$inferSelect;
export type ImportError = typeof importErrorsTable.$inferSelect;
export type InsertInventoryFile = z.infer<typeof insertInventoryFileSchema>;
export type InsertImportRun = z.infer<typeof insertImportRunSchema>;