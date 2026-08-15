import { eq, sql } from "drizzle-orm";
import {
  db,
  categoriesTable,
  companiesTable,
  drugsTable,
  importErrorsTable,
  importFilesTable,
  importJobsTable,
  productsTable,
  stockBatchesTable,
} from "@workspace/db";
import { getMapped, parseSdf, type ParsedSdf, type SdfType } from "./sdf";

type ParsedFile = { file: typeof importFilesTable.$inferSelect; parsed: ParsedSdf };
type SyncSummary = { imported: number; updated: number; unchanged: number; skipped: number };

function normalized(value: string) {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

function value(row: ParsedSdf["records"][number], parsed: ParsedSdf, key: string) {
  return getMapped(row, parsed.mapping, key);
}

function sourceData(row: ParsedSdf["records"][number], parsed: ParsedSdf) {
  return Object.fromEntries(parsed.fields.map((field) => [field.name, row.values[field.index] ?? ""]));
}

function validNumeric(valueToCheck: string) {
  if (!valueToCheck) return null;
  return /^-?\d+(?:\.\d+)?$/.test(valueToCheck) ? valueToCheck : null;
}

function addErrors(jobId: number, errors: Array<{ recordNumber: number; reason: string; sourceIdentifier?: string; excerpt?: string }>) {
  if (!errors.length) return Promise.resolve();
  return db.insert(importErrorsTable).values(errors.map((error) => ({
    jobId,
    fileId: null,
    recordNumber: error.recordNumber,
    reason: error.reason,
    sourceIdentifier: error.sourceIdentifier ?? null,
    sourceExcerpt: error.excerpt ?? null,
  })));
}

function compareCounts(existingHash: string | null | undefined, currentHash: string) {
  if (!existingHash) return "imported" as const;
  return existingHash === currentHash ? "unchanged" as const : "updated" as const;
}

async function upsertMaster(parsed: ParsedSdf, jobId: number): Promise<SyncSummary> {
  const errors: Array<{ recordNumber: number; reason: string; sourceIdentifier?: string }> = [];
  const summary: SyncSummary = { imported: 0, updated: 0, unchanged: 0, skipped: 0 };
  for (const row of parsed.records) {
    const sourceId = value(row, parsed, "sourceId");
    const name = value(row, parsed, "name");
    if (!sourceId || !name) {
      errors.push({ recordNumber: row.recordNumber, reason: "The source record must include a source ID and name.", sourceIdentifier: sourceId || undefined });
      continue;
    }
    if (parsed.type === "CATEGORY") {
      const [existing] = await db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.sourceCategoryId, sourceId)).limit(1);
      await db.insert(categoriesTable).values({ sourceCategoryId: sourceId, name, normalizedName: normalized(name), displayName: name }).onConflictDoUpdate({
        target: categoriesTable.sourceCategoryId,
        set: { name, normalizedName: normalized(name), updatedAt: new Date(), active: true },
      });
      bump(summary, !existing ? "imported" : existing.name === name ? "unchanged" : "updated");
    } else if (parsed.type === "COMPANY") {
      const code = value(row, parsed, "code") || null;
      const [existing] = await db.select({ id: companiesTable.id, name: companiesTable.name, code: companiesTable.code }).from(companiesTable).where(eq(companiesTable.sourceCompanyId, sourceId)).limit(1);
      await db.insert(companiesTable).values({ sourceCompanyId: sourceId, name, normalizedName: normalized(name), code }).onConflictDoUpdate({
        target: companiesTable.sourceCompanyId,
        set: { name, normalizedName: normalized(name), code, updatedAt: new Date() },
      });
      bump(summary, !existing ? "imported" : existing.name === name && existing.code === code ? "unchanged" : "updated");
    } else if (parsed.type === "DRUG") {
      const flags = value(row, parsed, "flags");
      const [existing] = await db.select({ id: drugsTable.id, drugName: drugsTable.drugName, sourceFlags: drugsTable.sourceFlags }).from(drugsTable).where(eq(drugsTable.sourceDrugId, sourceId)).limit(1);
      await db.insert(drugsTable).values({ sourceDrugId: sourceId, drugName: name, normalizedDrugName: normalized(name), sourceFlags: { flags } }).onConflictDoUpdate({
        target: drugsTable.sourceDrugId,
        set: { drugName: name, normalizedDrugName: normalized(name), sourceFlags: { flags }, updatedAt: new Date() },
      });
      bump(summary, !existing ? "imported" : existing.drugName === name && JSON.stringify(existing.sourceFlags) === JSON.stringify({ flags }) ? "unchanged" : "updated");
    }
  }
  summary.skipped = errors.length;
  await addErrors(jobId, errors);
  return summary;
}

function bump(summary: SyncSummary, state: "imported" | "updated" | "unchanged") {
  summary[state] += 1;
}

function chunks<T>(items: T[], size = 500) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

async function syncProducts(parsed: ParsedSdf, jobId: number): Promise<SyncSummary> {
  const errors: Array<{ recordNumber: number; reason: string; sourceIdentifier?: string }> = [];
  const summary: SyncSummary = { imported: 0, updated: 0, unchanged: 0, skipped: 0 };
  const [companies, categories, drugs, existingProducts] = await Promise.all([
    db.select({ id: companiesTable.id, sourceId: companiesTable.sourceCompanyId, normalizedName: companiesTable.normalizedName }).from(companiesTable),
    db.select({ id: categoriesTable.id, sourceId: categoriesTable.sourceCategoryId, normalizedName: categoriesTable.normalizedName }).from(categoriesTable),
    db.select({ id: drugsTable.id, sourceId: drugsTable.sourceDrugId, normalizedName: drugsTable.normalizedDrugName }).from(drugsTable),
    db.select({ sourceId: productsTable.sourceProductId, sourceHash: productsTable.sourceHash }).from(productsTable),
  ]);
  const existingBySource = new Map(existingProducts.map((product) => [product.sourceId, product.sourceHash]));
  const rowsToWrite: Array<typeof productsTable.$inferInsert> = [];
  const byRef = (items: Array<{ id: number; sourceId: string; normalizedName: string }>, ref: string) =>
    items.find((item) => item.sourceId === ref || item.normalizedName === normalized(ref))?.id ?? null;

  for (const row of parsed.records) {
    const sourceId = value(row, parsed, "sourceId");
    const productName = value(row, parsed, "name");
    const companyName = value(row, parsed, "companyName");
    const categoryName = value(row, parsed, "categoryName");
    const drugName = value(row, parsed, "drugName");
    const rowData = sourceData(row, parsed);
    const rowHash = JSON.stringify(rowData);
    if (!sourceId || !productName) {
      errors.push({ recordNumber: row.recordNumber, reason: "Product ID and product name are required.", sourceIdentifier: sourceId || undefined });
      continue;
    }

    const companyRef = value(row, parsed, "companyRef") || companyName;
    const categoryRef = value(row, parsed, "categoryRef") || categoryName;
    const drugRef = value(row, parsed, "drugRef") || drugName;
    const companyId = companyRef ? byRef(companies, companyRef) : null;
    const categoryId = categoryRef ? byRef(categories, categoryRef) : null;
    const drugId = drugRef ? byRef(drugs, drugRef) : null;
    const dosagePack = value(row, parsed, "dosagePack") || value(row, parsed, "dosageForm");
    const unitCount = value(row, parsed, "unitCount");
    const packDetail = value(row, parsed, "packDetail") || value(row, parsed, "packSize");
    const sourceCategory = value(row, parsed, "sourceCategory") || categoryName;
    const state = compareCounts(existingBySource.get(sourceId), rowHash);
    rowsToWrite.push({
      sourceProductId: sourceId,
      productName,
      normalizedProductName: normalized(productName),
      companyId,
      categoryId,
      drugId,
      sourceCompanyName: companyName || null,
      sourceCategoryName: categoryName || null,
      sourceDrugName: drugName || null,
      dosageForm: dosagePack || null,
      packSize: packDetail || unitCount || null,
      dosagePack: dosagePack || null,
      unitCount: unitCount || null,
      packDetail: packDetail || null,
      sourceCategory: sourceCategory || null,
      sourceData: rowData,
      sourceHash: rowHash,
      active: true,
    });
    bump(summary, state);
  }
  for (const batch of chunks(rowsToWrite)) {
    await db.insert(productsTable).values(batch).onConflictDoUpdate({
      target: productsTable.sourceProductId,
      set: {
        productName: sql`excluded.product_name`,
        normalizedProductName: sql`excluded.normalized_product_name`,
        companyId: sql`excluded.company_id`,
        categoryId: sql`excluded.category_id`,
        drugId: sql`excluded.drug_id`,
        sourceCompanyName: sql`excluded.source_company_name`,
        sourceCategoryName: sql`excluded.source_category_name`,
        sourceDrugName: sql`excluded.source_drug_name`,
        dosageForm: sql`excluded.dosage_form`,
        packSize: sql`excluded.pack_size`,
        dosagePack: sql`excluded.dosage_pack`,
        unitCount: sql`excluded.unit_count`,
        packDetail: sql`excluded.pack_detail`,
        sourceCategory: sql`excluded.source_category`,
        sourceData: sql`excluded.source_data`,
        sourceHash: sql`excluded.source_hash`,
        active: sql`excluded.active`,
        updatedAt: new Date(),
      },
    });
  }
  summary.skipped = errors.length;
  await addErrors(jobId, errors);
  return summary;
}

async function syncStock(parsed: ParsedSdf, jobId: number): Promise<SyncSummary> {
  const errors: Array<{ recordNumber: number; reason: string; sourceIdentifier?: string }> = [];
  const summary: SyncSummary = { imported: 0, updated: 0, unchanged: 0, skipped: 0 };
  const [products, existingStocks] = await Promise.all([
    db.select({ id: productsTable.id, sourceId: productsTable.sourceProductId }).from(productsTable),
    db.select({ sourceId: stockBatchesTable.sourceStockId, sourceData: stockBatchesTable.sourceData }).from(stockBatchesTable),
  ]);
  const existingBySource = new Map(existingStocks.map((stock) => [stock.sourceId, JSON.stringify(stock.sourceData)]));
  const rowsToWrite: Array<typeof stockBatchesTable.$inferInsert> = [];
  for (const row of parsed.records) {
    const sourceId = value(row, parsed, "sourceId");
    const productRef = value(row, parsed, "productRef");
    const rowData = sourceData(row, parsed);
    const rowHash = JSON.stringify(rowData);
    if (!sourceId) {
      errors.push({ recordNumber: row.recordNumber, reason: "Stock ID is required.", sourceIdentifier: undefined });
      continue;
    }
    const productId = productRef ? products.find((product) => product.sourceId === productRef)?.id ?? null : null;
    const linkStatus = productRef ? (productId ? "linked" : "unlinked_product_not_found") : "unlinked_no_product_reference";
    if (productRef && !productId) {
      errors.push({ recordNumber: row.recordNumber, reason: "Stock record references a product that was not imported; the stock row was retained unlinked.", sourceIdentifier: productRef });
    }
    const state = compareCounts(existingBySource.get(sourceId), rowHash);
    rowsToWrite.push({
      sourceStockId: sourceId,
      productId,
      batchNumber: value(row, parsed, "batch") || null,
      expiryMonth: value(row, parsed, "expiry") || null,
      expiryDate: null,
      quantity: validNumeric(value(row, parsed, "quantity")),
      batchQuantity: validNumeric(value(row, parsed, "batchQuantity")),
      mrp: validNumeric(value(row, parsed, "mrp")),
      salePrice: validNumeric(value(row, parsed, "salePrice")),
      cost: validNumeric(value(row, parsed, "cost")),
      discount: validNumeric(value(row, parsed, "discount")),
      priceFlag: value(row, parsed, "priceFlag") || null,
      stockFlag: value(row, parsed, "stockFlag") || null,
      linkStatus,
      sourceData: rowData,
      lastSyncedAt: new Date(),
    });
    bump(summary, state);
  }
  for (const batch of chunks(rowsToWrite)) {
    await db.insert(stockBatchesTable).values(batch).onConflictDoUpdate({
      target: stockBatchesTable.sourceStockId,
      set: {
        productId: sql`excluded.product_id`,
        batchNumber: sql`excluded.batch_number`,
        expiryMonth: sql`excluded.expiry_month`,
        expiryDate: sql`excluded.expiry_date`,
        quantity: sql`excluded.quantity`,
        batchQuantity: sql`excluded.batch_quantity`,
        mrp: sql`excluded.mrp`,
        salePrice: sql`excluded.sale_price`,
        cost: sql`excluded.cost`,
        discount: sql`excluded.discount`,
        priceFlag: sql`excluded.price_flag`,
        stockFlag: sql`excluded.stock_flag`,
        linkStatus: sql`excluded.link_status`,
        sourceData: sql`excluded.source_data`,
        lastSyncedAt: sql`excluded.last_synced_at`,
        updatedAt: new Date(),
      },
    });
  }
  summary.skipped = errors.length;
  await addErrors(jobId, errors);
  return summary;
}

export async function previewImportFile(fileName: string, source: string | Buffer) {
  return parseSdf(fileName, source);
}

export async function syncImportJob(jobId: number) {
  const files = await db.select().from(importFilesTable).where(eq(importFilesTable.jobId, jobId));
  const ordered = (["CATEGORY", "COMPANY", "DRUG", "PRODUCT", "STOCK"] as SdfType[])
    .map((type) => files.find((file) => file.fileType === type))
    .filter(Boolean) as typeof files;
  if (!ordered.length) throw new Error("Upload at least one SDF file before synchronization.");
  const parsedFiles: ParsedFile[] = ordered.map((file) => ({ file, parsed: parseSdf(file.fileName, file.sourceText) }));
  const blocked = parsedFiles.filter(({ parsed }) => parsed.mappingStatus === "review_required");
  if (blocked.length) throw new Error(`Cannot synchronize ${blocked.map(({ file }) => file.fileName).join(", ")} until its field mapping is verified.`);
  await db.update(importJobsTable).set({ status: "importing", startedAt: new Date() }).where(eq(importJobsTable.id, jobId));
  const startedAt = Date.now();
  const summary: SyncSummary = { imported: 0, updated: 0, unchanged: 0, skipped: 0 };
  summary.skipped = parsedFiles.reduce((total, { parsed }) => total + parsed.errors.length, 0);
  for (const { parsed } of parsedFiles) {
    const result = parsed.type === "PRODUCT"
      ? await syncProducts(parsed, jobId)
      : parsed.type === "STOCK"
        ? await syncStock(parsed, jobId)
        : await upsertMaster(parsed, jobId);
    summary.imported += result.imported;
    summary.updated += result.updated;
    summary.unchanged += result.unchanged;
    summary.skipped += result.skipped;
  }
  await db.update(importJobsTable).set({
    status: "completed",
    completedAt: new Date(),
    recordsImported: summary.imported,
    recordsUpdated: summary.updated,
    recordsUnchanged: summary.unchanged,
    recordsSkipped: summary.skipped,
    errorCount: summary.skipped,
    durationMs: Date.now() - startedAt,
    summary,
  }).where(eq(importJobsTable.id, jobId));
  return summary;
}