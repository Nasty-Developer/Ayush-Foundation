import { and, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db, categoriesTable, companiesTable, drugsTable, importErrorsTable, importFilesTable, importJobsTable, productsTable, stockBatchesTable } from "@workspace/db";
import { getMapped, parseSdf, type ParsedSdf, type SdfType } from "./sdf";

type ParsedFile = { file: typeof importFilesTable.$inferSelect; parsed: ParsedSdf };

function normalized(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function value(row: ParsedSdf["records"][number], parsed: ParsedSdf, key: string) {
  return getMapped(row, parsed.mapping, key);
}

function requiredMapping(parsed: ParsedSdf, keys: string[]) {
  return keys.filter((key) => parsed.mapping[key] === undefined);
}

function sourceHash(value: Record<string, unknown>) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function upsertMaster(parsed: ParsedSdf, jobId: number) {
  const errors: Array<{ recordNumber: number; reason: string; sourceIdentifier?: string }> = [];
  let imported = 0;
  let updated = 0;
  let unchanged = 0;
  for (const row of parsed.records) {
    const sourceId = value(row, parsed, "sourceId") || `${parsed.type.toLowerCase()}-${row.recordNumber}`;
    const name = value(row, parsed, "name");
    if (!name) {
      errors.push({ recordNumber: row.recordNumber, reason: "The source record has no mapped name." });
      continue;
    }
    if (parsed.type === "CATEGORY") {
      const [existing] = await db.select().from(categoriesTable).where(eq(categoriesTable.normalizedName, normalized(name))).limit(1);
      if (existing && existing.sourceCategoryId === sourceId && existing.name === name && existing.active) {
        unchanged += 1;
        continue;
      }
      await db.insert(categoriesTable).values({ sourceCategoryId: sourceId, name, normalizedName: normalized(name), displayName: name }).onConflictDoUpdate({ target: categoriesTable.normalizedName, set: { sourceCategoryId: sourceId, name, updatedAt: new Date(), active: true } });
      existing ? updated += 1 : imported += 1;
    } else if (parsed.type === "COMPANY") {
      const code = value(row, parsed, "code") || null;
      const [existing] = await db.select().from(companiesTable).where(eq(companiesTable.normalizedName, normalized(name))).limit(1);
      if (existing && existing.sourceCompanyId === sourceId && existing.name === name && existing.code === code) {
        unchanged += 1;
        continue;
      }
      await db.insert(companiesTable).values({ sourceCompanyId: sourceId, name, normalizedName: normalized(name), code }).onConflictDoUpdate({ target: companiesTable.normalizedName, set: { sourceCompanyId: sourceId, name, code, updatedAt: new Date() } });
      existing ? updated += 1 : imported += 1;
    } else if (parsed.type === "DRUG") {
      const [existing] = await db.select().from(drugsTable).where(eq(drugsTable.normalizedDrugName, normalized(name))).limit(1);
      if (existing && existing.sourceDrugId === sourceId && existing.drugName === name) {
        unchanged += 1;
        continue;
      }
      await db.insert(drugsTable).values({ sourceDrugId: sourceId, drugName: name, normalizedDrugName: normalized(name), sourceFlags: {} }).onConflictDoUpdate({ target: drugsTable.normalizedDrugName, set: { sourceDrugId: sourceId, drugName: name, updatedAt: new Date() } });
      existing ? updated += 1 : imported += 1;
    }
  }
  if (errors.length) await db.insert(importErrorsTable).values(errors.map((error) => ({ jobId, fileId: null, recordNumber: error.recordNumber, reason: error.reason, sourceIdentifier: error.sourceIdentifier ?? null, sourceExcerpt: null })));
  return { imported, updated, unchanged, skipped: errors.length };
}

async function syncProducts(parsed: ParsedSdf, jobId: number) {
  const errors: Array<{ recordNumber: number; reason: string; sourceIdentifier?: string }> = [];
  let imported = 0;
  let updated = 0;
  let unchanged = 0;
  const [companies, categories, drugs] = await Promise.all([
    db.select({ id: companiesTable.id, sourceId: companiesTable.sourceCompanyId, normalizedName: companiesTable.normalizedName }).from(companiesTable),
    db.select({ id: categoriesTable.id, sourceId: categoriesTable.sourceCategoryId, normalizedName: categoriesTable.normalizedName }).from(categoriesTable),
    db.select({ id: drugsTable.id, sourceId: drugsTable.sourceDrugId, normalizedName: drugsTable.normalizedDrugName }).from(drugsTable),
  ]);
  const byRef = (items: Array<{ id: number; sourceId: string; normalizedName: string }>, ref: string) => items.find((item) => item.sourceId === ref || item.normalizedName === normalized(ref))?.id;
  for (const row of parsed.records) {
    const sourceId = value(row, parsed, "sourceId");
    const productName = value(row, parsed, "name");
    if (!sourceId || !productName) {
      errors.push({ recordNumber: row.recordNumber, reason: "Product ID and product name are required.", sourceIdentifier: sourceId || undefined });
      continue;
    }
    const sourceData = Object.fromEntries(parsed.fields.map((field) => [field.name, row.values[field.index] ?? ""]));
    const companyRef = value(row, parsed, "companyRef");
    const categoryRef = value(row, parsed, "categoryRef");
    const drugRef = value(row, parsed, "drugRef");
    const recordHash = sourceHash(sourceData);
    const [existing] = await db.select({ id: productsTable.id, sourceHash: productsTable.sourceHash }).from(productsTable).where(eq(productsTable.sourceProductId, sourceId)).limit(1);
    if (existing?.sourceHash === recordHash) {
      unchanged += 1;
      continue;
    }
    await db.insert(productsTable).values({
      sourceProductId: sourceId,
      productName,
      normalizedProductName: normalized(productName),
      companyId: companyRef ? byRef(companies, companyRef) ?? null : null,
      categoryId: categoryRef ? byRef(categories, categoryRef) ?? null : null,
      drugId: drugRef ? byRef(drugs, drugRef) ?? null : null,
      dosageForm: value(row, parsed, "dosageForm") || null,
      packSize: value(row, parsed, "packSize") || null,
      sourceCategory: value(row, parsed, "sourceCategory") || null,
      sourceData,
      sourceHash: recordHash,
      active: true,
    }).onConflictDoUpdate({ target: productsTable.sourceProductId, set: {
      productName,
      normalizedProductName: normalized(productName),
      companyId: companyRef ? byRef(companies, companyRef) ?? null : null,
      categoryId: categoryRef ? byRef(categories, categoryRef) ?? null : null,
      drugId: drugRef ? byRef(drugs, drugRef) ?? null : null,
      dosageForm: value(row, parsed, "dosageForm") || null,
      packSize: value(row, parsed, "packSize") || null,
      sourceCategory: value(row, parsed, "sourceCategory") || null,
      sourceData,
      sourceHash: recordHash,
      active: true,
      updatedAt: new Date(),
    } });
    existing ? updated += 1 : imported += 1;
  }
  if (errors.length) await db.insert(importErrorsTable).values(errors.map((error) => ({ jobId, fileId: null, recordNumber: error.recordNumber, reason: error.reason, sourceIdentifier: error.sourceIdentifier ?? null, sourceExcerpt: null })));
  return { imported, updated, unchanged, skipped: errors.length };
}

async function syncStock(parsed: ParsedSdf, jobId: number) {
  const errors: Array<{ recordNumber: number; reason: string; sourceIdentifier?: string }> = [];
  const products = await db.select({ id: productsTable.id, sourceId: productsTable.sourceProductId }).from(productsTable);
  let imported = 0;
  let updated = 0;
  let unchanged = 0;
  for (const row of parsed.records) {
    const sourceId = value(row, parsed, "sourceId");
    const productRef = value(row, parsed, "productRef");
    if (!sourceId || !productRef) {
      errors.push({ recordNumber: row.recordNumber, reason: "Stock ID and product reference are required.", sourceIdentifier: sourceId || undefined });
      continue;
    }
    const productId = products.find((product) => product.sourceId === productRef)?.id;
    if (!productId) {
      errors.push({ recordNumber: row.recordNumber, reason: "Stock record references a product that was not imported.", sourceIdentifier: productRef });
      continue;
    }
    const sourceData = Object.fromEntries(parsed.fields.map((field) => [field.name, row.values[field.index] ?? ""]));
    const recordHash = sourceHash(sourceData);
    const [existing] = await db.select({ id: stockBatchesTable.id, sourceData: stockBatchesTable.sourceData }).from(stockBatchesTable).where(eq(stockBatchesTable.sourceStockId, sourceId)).limit(1);
    if (existing && sourceHash(existing.sourceData ?? {}) === recordHash) {
      unchanged += 1;
      continue;
    }
    await db.insert(stockBatchesTable).values({
      sourceStockId: sourceId,
      productId,
      batchNumber: value(row, parsed, "batch") || null,
      expiryDate: value(row, parsed, "expiry") || null,
      quantity: value(row, parsed, "quantity") || null,
      mrp: value(row, parsed, "mrp") || null,
      salePrice: value(row, parsed, "salePrice") || null,
      cost: value(row, parsed, "cost") || null,
      sourceData,
      lastSyncedAt: new Date(),
    }).onConflictDoUpdate({ target: stockBatchesTable.sourceStockId, set: {
      productId,
      batchNumber: value(row, parsed, "batch") || null,
      expiryDate: value(row, parsed, "expiry") || null,
      quantity: value(row, parsed, "quantity") || null,
      mrp: value(row, parsed, "mrp") || null,
      salePrice: value(row, parsed, "salePrice") || null,
      cost: value(row, parsed, "cost") || null,
      sourceData,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    } });
    existing ? updated += 1 : imported += 1;
  }
  if (errors.length) await db.insert(importErrorsTable).values(errors.map((error) => ({ jobId, fileId: null, recordNumber: error.recordNumber, reason: error.reason, sourceIdentifier: error.sourceIdentifier ?? null, sourceExcerpt: null })));
  return { imported, updated, unchanged, skipped: errors.length };
}

export async function previewImportFile(fileName: string, sourceText: string) {
  return parseSdf(fileName, sourceText);
}

export async function syncImportJob(jobId: number) {
  const files = await db.select().from(importFilesTable).where(eq(importFilesTable.jobId, jobId));
  const ordered = (["CATEGORY", "COMPANY", "DRUG", "PRODUCT", "STOCK"] as SdfType[]).map((type) => files.find((file) => file.fileType === type)).filter(Boolean) as typeof files;
  if (!ordered.length) throw new Error("Upload at least one SDF file before synchronization.");
  const parsedFiles: ParsedFile[] = ordered.map((file) => ({ file, parsed: parseSdf(file.fileName, file.sourceText) }));
  const blocked = parsedFiles.filter(({ parsed }) => parsed.mappingStatus !== "verified_from_header");
  if (blocked.length) throw new Error(`Cannot synchronize ${blocked.map(({ file }) => file.fileName).join(", ")} until its fixed-width/structured field mapping is verified. Upload a file with its source header or provide the mapping configuration.`);
  await db.update(importJobsTable).set({ status: "importing", startedAt: new Date() }).where(eq(importJobsTable.id, jobId));
  const summary = { imported: 0, updated: 0, unchanged: 0, skipped: 0 };
  for (const { parsed } of parsedFiles) {
    const result = parsed.type === "PRODUCT" ? await syncProducts(parsed, jobId) : parsed.type === "STOCK" ? await syncStock(parsed, jobId) : await upsertMaster(parsed, jobId);
    summary.imported += result.imported;
    summary.updated += result.updated;
    summary.unchanged += result.unchanged;
    summary.skipped += result.skipped;
  }
  const completedAt = new Date();
  const [job] = await db.select({ startedAt: importJobsTable.startedAt }).from(importJobsTable).where(eq(importJobsTable.id, jobId)).limit(1);
  await db.update(importJobsTable).set({ status: "completed", completedAt, recordsImported: summary.imported, recordsUpdated: summary.updated, recordsUnchanged: summary.unchanged, recordsSkipped: summary.skipped, errorCount: summary.skipped, durationMs: job?.startedAt ? Math.max(0, completedAt.getTime() - job.startedAt.getTime()) : null, summary }).where(eq(importJobsTable.id, jobId));
  return summary;
}