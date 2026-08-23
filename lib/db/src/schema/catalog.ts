import { createInsertSchema } from "drizzle-zod";
import {
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
import { z } from "zod/v4";

const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};

export const companiesTable = pgTable("catalog_companies", {
  id: serial("id").primaryKey(),
  sourceCompanyId: text("source_company_id").notNull().default(""),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  code: text("code"),
  logoUrl: text("logo_url"),
  cloudinaryPublicId: text("cloudinary_public_id"),
  ...auditColumns,
}, (table) => [
  uniqueIndex("catalog_companies_source_id_idx").on(table.sourceCompanyId),
  uniqueIndex("catalog_companies_normalized_name_idx").on(table.normalizedName),
]);

export const categoriesTable = pgTable("catalog_categories", {
  id: serial("id").primaryKey(),
  sourceCategoryId: text("source_category_id").notNull().default(""),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  displayName: text("display_name"),
  code: text("code"),
  imageUrl: text("image_url"),
  cloudinaryPublicId: text("cloudinary_public_id"),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  ...auditColumns,
}, (table) => [
  uniqueIndex("catalog_categories_source_id_idx").on(table.sourceCategoryId),
  uniqueIndex("catalog_categories_normalized_name_idx").on(table.normalizedName),
]);

export const drugsTable = pgTable("catalog_drugs", {
  id: serial("id").primaryKey(),
  sourceDrugId: text("source_drug_id").notNull().default(""),
  drugName: text("drug_name").notNull(),
  normalizedDrugName: text("normalized_drug_name").notNull(),
  sourceFlags: jsonb("source_flags").$type<Record<string, unknown>>(),
  ...auditColumns,
}, (table) => [
  uniqueIndex("catalog_drugs_source_id_idx").on(table.sourceDrugId),
  uniqueIndex("catalog_drugs_normalized_name_idx").on(table.normalizedDrugName),
]);

export const productsTable = pgTable("catalog_products", {
  id: serial("id").primaryKey(),
  sourceProductId: text("source_product_id").notNull(),
  productName: text("product_name").notNull(),
  normalizedProductName: text("normalized_product_name").notNull(),
  companyId: integer("company_id"),
  categoryId: integer("category_id"),
  drugId: integer("drug_id"),
  dosageForm: text("dosage_form"),
  packSize: text("pack_size"),
  sourceCategory: text("source_category"),
  sourceData: jsonb("source_data").$type<Record<string, unknown>>().notNull().default({}),
  sourceHash: text("source_hash"),
  imageUrl: text("image_url"),
  cloudinaryPublicId: text("cloudinary_public_id"),
  active: boolean("active").notNull().default(true),
  ...auditColumns,
}, (table) => [
  uniqueIndex("catalog_products_source_id_idx").on(table.sourceProductId),
  index("catalog_products_name_idx").on(table.normalizedProductName),
  index("catalog_products_company_idx").on(table.companyId),
  index("catalog_products_category_idx").on(table.categoryId),
  index("catalog_products_drug_idx").on(table.drugId),
  index("catalog_products_active_idx").on(table.active),
]);

export const productOverridesTable = pgTable("catalog_product_overrides", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  localDisplayName: text("local_display_name"),
  localCategoryId: integer("local_category_id"),
  imageUrl: text("image_url"),
  cloudinaryPublicId: text("cloudinary_public_id"),
  visible: boolean("visible"),
  prescriptionRequired: boolean("prescription_required"),
  newArrival: boolean("new_arrival"),
  specialMedicine: boolean("special_medicine"),
  notes: text("notes"),
  ...auditColumns,
}, (table) => [
  uniqueIndex("catalog_product_overrides_product_idx").on(table.productId),
]);

export const stockBatchesTable = pgTable("catalog_stock_batches", {
  id: serial("id").primaryKey(),
  sourceStockId: text("source_stock_id").notNull(),
  productId: integer("product_id"),
  batchNumber: text("batch_number"),
  expiryDate: date("expiry_date", { mode: "string" }),
  quantity: numeric("quantity"),
  mrp: numeric("mrp"),
  salePrice: numeric("sale_price"),
  cost: numeric("cost"),
  sourceData: jsonb("source_data").$type<Record<string, unknown>>().notNull().default({}),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull().defaultNow(),
  ...auditColumns,
}, (table) => [
  uniqueIndex("catalog_stock_source_id_idx").on(table.sourceStockId),
  index("catalog_stock_product_idx").on(table.productId),
]);

export const importJobsTable = pgTable("catalog_import_jobs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("uploaded"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  recordsDetected: integer("records_detected").notNull().default(0),
  recordsImported: integer("records_imported").notNull().default(0),
  recordsUpdated: integer("records_updated").notNull().default(0),
  recordsUnchanged: integer("records_unchanged").notNull().default(0),
  recordsSkipped: integer("records_skipped").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  durationMs: integer("duration_ms"),
  summary: jsonb("summary").$type<Record<string, unknown>>(),
  ...auditColumns,
}, (table) => [index("catalog_import_jobs_status_idx").on(table.status)]);

export const importFilesTable = pgTable("catalog_import_files", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  fileType: text("file_type").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  contentHash: text("content_hash").notNull(),
  sourceText: text("source_text").notNull(),
  detectedDelimiter: text("detected_delimiter"),
  recordCount: integer("record_count").notNull().default(0),
  mappingStatus: text("mapping_status").notNull().default("unknown"),
  mapping: jsonb("mapping").$type<Record<string, unknown>>(),
  preview: jsonb("preview").$type<Record<string, unknown>[]>(),
  ...auditColumns,
}, (table) => [
  uniqueIndex("catalog_import_files_job_type_idx").on(table.jobId, table.fileType),
  index("catalog_import_files_hash_idx").on(table.contentHash),
]);

export const importErrorsTable = pgTable("catalog_import_errors", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  fileId: integer("file_id"),
  recordNumber: integer("record_number"),
  reason: text("reason").notNull(),
  sourceIdentifier: text("source_identifier"),
  sourceExcerpt: text("source_excerpt"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("catalog_import_errors_job_idx").on(table.jobId)]);

export const insertCompanySchema = createInsertSchema(companiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDrugSchema = createInsertSchema(drugsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStockBatchSchema = createInsertSchema(stockBatchesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertImportJobSchema = createInsertSchema(importJobsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type Company = typeof companiesTable.$inferSelect;
export type Category = typeof categoriesTable.$inferSelect;
export type Drug = typeof drugsTable.$inferSelect;
export type Product = typeof productsTable.$inferSelect;
export type StockBatch = typeof stockBatchesTable.$inferSelect;
export type ImportJob = typeof importJobsTable.$inferSelect;
export type ImportFile = typeof importFilesTable.$inferSelect;
export type ImportError = typeof importErrorsTable.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertDrug = z.infer<typeof insertDrugSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertStockBatch = z.infer<typeof insertStockBatchSchema>;

export const customerProfilesTable = pgTable("customer_profiles", {
  uid: text("uid").primaryKey(),
  email: text("email"),
  displayName: text("display_name"),
  phone: text("phone"),
  ...auditColumns,
});

export const customerAddressesTable = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerUid: text("customer_uid").notNull(),
  label: text("label").notNull().default("Home"),
  recipientName: text("recipient_name").notNull(),
  phone: text("phone").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  landmark: text("landmark"),
  city: text("city").notNull(),
  pincode: text("pincode").notNull(),
  deliveryNotes: text("delivery_notes"),
  isDefault: boolean("is_default").notNull().default(false),
  ...auditColumns,
}, (table) => [
  index("customer_addresses_customer_idx").on(table.customerUid),
]);

export const ordersTable = pgTable("pharmacy_orders", {
  id: serial("id").primaryKey(),
  publicOrderId: text("public_order_id").notNull(),
  customerUid: text("customer_uid").notNull(),
  customerEmail: text("customer_email"),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: jsonb("address").$type<Record<string, unknown>>().notNull(),
  subtotal: numeric("subtotal").notNull(),
  deliveryCharge: numeric("delivery_charge").notNull().default("0"),
  total: numeric("total").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentProvider: text("payment_provider"),
  paymentReference: text("payment_reference"),
  prescriptionStatus: text("prescription_status").notNull().default("not_required"),
  prescriptionPath: text("prescription_path"),
  orderStatus: text("order_status").notNull().default("pending"),
  notes: text("notes"),
  ...auditColumns,
}, (table) => [
  uniqueIndex("pharmacy_orders_public_id_idx").on(table.publicOrderId),
  index("pharmacy_orders_customer_idx").on(table.customerUid),
  index("pharmacy_orders_status_idx").on(table.orderStatus),
  index("pharmacy_orders_payment_status_idx").on(table.paymentStatus),
]);

export const orderItemsTable = pgTable("pharmacy_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  sourceProductId: text("source_product_id").notNull(),
  productName: text("product_name").notNull(),
  companyName: text("company_name"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  lineTotal: numeric("line_total").notNull(),
  prescriptionRequired: boolean("prescription_required").notNull().default(false),
  productSnapshot: jsonb("product_snapshot").$type<Record<string, unknown>>().notNull().default({}),
  ...auditColumns,
}, (table) => [
  index("pharmacy_order_items_order_idx").on(table.orderId),
  index("pharmacy_order_items_product_idx").on(table.productId),
]);

export const prescriptionUploadsTable = pgTable("prescription_uploads", {
  id: serial("id").primaryKey(),
  customerUid: text("customer_uid").notNull(),
  objectPath: text("object_path").notNull(),
  contentType: text("content_type").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull().default("pending_review"),
  ...auditColumns,
}, (table) => [
  uniqueIndex("prescription_uploads_path_idx").on(table.objectPath),
  index("prescription_uploads_customer_idx").on(table.customerUid),
]);

export const insertCustomerProfileSchema = createInsertSchema(customerProfilesTable);
export const insertCustomerAddressSchema = createInsertSchema(customerAddressesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type CustomerProfile = typeof customerProfilesTable.$inferSelect;
export type CustomerAddress = typeof customerAddressesTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type PrescriptionUpload = typeof prescriptionUploadsTable.$inferSelect;
export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;