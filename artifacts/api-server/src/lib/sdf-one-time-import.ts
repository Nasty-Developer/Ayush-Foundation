import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { createInterface } from "node:readline";
import { pool } from "@workspace/db";

export type SdfFilePaths = {
  product: string;
  stock: string;
  company: string;
  category: string;
  drug: string;
};

export type ImportCounters = {
  found: number;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  errors: string[];
};

export type OneTimeImportSummary = {
  files: Record<string, ImportCounters>;
  products: ImportCounters;
  companies: ImportCounters;
  categories: ImportCounters;
  drugGroups: ImportCounters;
  stock: ImportCounters;
  unresolvedStockProductReferences: number;
  durationMs: number;
};

function counters(): ImportCounters {
  return { found: 0, inserted: 0, updated: 0, unchanged: 0, skipped: 0, errors: [] };
}

function field(line: string, start: number, end: number) {
  return line.slice(start, end).trim();
}

function normalized(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function parseNumber(value: string) {
  return value.trim() || null;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function parseExpiry(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return null;
  return `${match[2]}-${String(month).padStart(2, "0")}-01`;
}

async function* lines(path: string) {
  const input = createReadStream(path, { encoding: "utf8" });
  const reader = createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of reader) {
      const value = String(line).replace(/^\uFEFF/, "");
      if (value.trim()) yield value;
    }
  } finally {
    reader.close();
    input.destroy();
  }
}

function fileHash(path: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    const input = createReadStream(path);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("error", reject);
    input.on("end", () => resolve(hash.digest("hex")));
  });
}

async function importMaster(
  client: { query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> },
  path: string,
  kind: "company" | "category" | "drug",
) {
  const result = counters();
  for await (const line of lines(path)) {
    result.found += 1;
    const parsed =
      kind === "company"
        ? { sourceId: field(line, 120, 126), name: field(line, 0, 30), code: field(line, 30, 60) }
        : kind === "category"
          ? { sourceId: field(line, 35, 41), name: field(line, 0, 35) }
          : { sourceId: field(line, 120, 124), name: field(line, 0, 60), flags: field(line, 60, 120) };
    if (!parsed.sourceId || !parsed.name) {
      result.skipped += 1;
      result.errors.push(`Record ${result.found}: missing source identifier or name`);
      continue;
    }
    const table = kind === "company" ? "catalog_companies" : kind === "category" ? "catalog_categories" : "catalog_drugs";
    const sourceColumn = kind === "company" ? "source_company_id" : kind === "category" ? "source_category_id" : "source_drug_id";
    const nameColumn = kind === "drug" ? "drug_name" : "name";
    const normalizedColumn = kind === "drug" ? "normalized_drug_name" : "normalized_name";
    const existingColumns =
      kind === "company"
        ? "id, name AS value, code"
        : kind === "category"
          ? "id, name AS value"
          : "id, drug_name AS value, source_flags AS flags";
    const existing = await client.query(
      `SELECT ${existingColumns} FROM ${table} WHERE ${sourceColumn} = $1 LIMIT 1`,
      [parsed.sourceId],
    );
    const previous = existing.rows[0];
    if (kind === "company") {
      await client.query(
        `INSERT INTO catalog_companies (source_company_id, name, normalized_name, code)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (source_company_id) DO UPDATE SET name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name, code = EXCLUDED.code, updated_at = NOW()`,
        [parsed.sourceId, parsed.name, normalized(parsed.name), parsed.code || null],
      );
      previous ? (previous.value === parsed.name && previous.code === (parsed.code || null) ? result.unchanged++ : result.updated++) : result.inserted++;
    } else if (kind === "category") {
      await client.query(
        `INSERT INTO catalog_categories (source_category_id, name, normalized_name, display_name)
         VALUES ($1, $2, $3, $2)
         ON CONFLICT (source_category_id) DO UPDATE SET name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name, display_name = EXCLUDED.display_name, updated_at = NOW(), active = TRUE`,
        [parsed.sourceId, parsed.name, normalized(parsed.name)],
      );
      previous ? (previous.value === parsed.name ? result.unchanged++ : result.updated++) : result.inserted++;
    } else {
      await client.query(
        `INSERT INTO catalog_drugs (source_drug_id, drug_name, normalized_drug_name, source_flags)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (source_drug_id) DO UPDATE SET drug_name = EXCLUDED.drug_name, normalized_drug_name = EXCLUDED.normalized_drug_name, source_flags = EXCLUDED.source_flags, updated_at = NOW()`,
        [parsed.sourceId, parsed.name, normalized(parsed.name), { rawFlags: parsed.flags }],
      );
      previous
        ? previous.value === parsed.name && stableJson(previous.flags) === stableJson({ rawFlags: parsed.flags })
          ? result.unchanged++
          : result.updated++
        : result.inserted++;
    }
  }
  return result;
}

async function importProducts(
  client: { query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> },
  path: string,
) {
  const result = counters();
  const companies = new Map<string, number>();
  const categories = new Map<string, number>();
  const drugs = new Map<string, number>();
  for (const row of (await client.query("SELECT id, source_company_id, normalized_name FROM catalog_companies")).rows) {
    companies.set(String(row.source_company_id), Number(row.id));
    companies.set(String(row.normalized_name), Number(row.id));
  }
  for (const row of (await client.query("SELECT id, source_category_id, normalized_name FROM catalog_categories")).rows) {
    categories.set(String(row.source_category_id), Number(row.id));
    categories.set(String(row.normalized_name), Number(row.id));
  }
  for (const row of (await client.query("SELECT id, source_drug_id, normalized_drug_name FROM catalog_drugs")).rows) {
    drugs.set(String(row.source_drug_id), Number(row.id));
    drugs.set(String(row.normalized_drug_name), Number(row.id));
  }
  for await (const line of lines(path)) {
    result.found += 1;
    const sourceProductId = field(line, 476, 486);
    const productName = field(line, 0, 74);
    const companyName = field(line, 75, 105);
    const categoryName = field(line, 105, 135);
    const drugName = field(line, 135, 195);
    const packSize = field(line, 195, 230);
    if (!sourceProductId || !productName) {
      result.skipped += 1;
      result.errors.push(`Record ${result.found}: missing product identifier or name`);
      continue;
    }
    const sourceData = {
      fixedWidth: true,
      parserVersion: 2,
      company: companyName,
      category: categoryName,
      drug: drugName,
      pack: packSize,
      raw: line,
    };
    const hash = createHash("sha256").update(stableJson(sourceData)).digest("hex");
    const companyId = companies.get(companyName) ?? companies.get(normalized(companyName)) ?? null;
    const categoryId = categories.get(categoryName) ?? categories.get(normalized(categoryName)) ?? null;
    const drugId = drugs.get(drugName) ?? drugs.get(normalized(drugName)) ?? null;
    const existing = await client.query(
      "SELECT source_hash, source_data->>'raw' AS raw FROM catalog_products WHERE source_product_id = $1 LIMIT 1",
      [sourceProductId],
    );
    if (existing.rows[0]?.source_hash === hash) {
      result.unchanged += 1;
      continue;
    }
    await client.query(
      `INSERT INTO catalog_products
       (source_product_id, product_name, normalized_product_name, company_id, category_id, drug_id, dosage_form, pack_size, source_category, source_data, source_hash, image_url, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULL, TRUE)
       ON CONFLICT (source_product_id) DO UPDATE SET
         product_name = EXCLUDED.product_name, normalized_product_name = EXCLUDED.normalized_product_name,
         company_id = EXCLUDED.company_id, category_id = EXCLUDED.category_id, drug_id = EXCLUDED.drug_id,
         dosage_form = EXCLUDED.dosage_form, pack_size = EXCLUDED.pack_size, source_category = EXCLUDED.source_category,
         source_data = EXCLUDED.source_data, source_hash = EXCLUDED.source_hash, active = TRUE, updated_at = NOW()`,
      [sourceProductId, productName, normalized(productName), companyId, categoryId, drugId, packSize.split(/\s+/)[0] || null, packSize || null, categoryName || null, sourceData, hash],
    );
    existing.rows[0] ? (result.updated += 1) : (result.inserted += 1);
  }
  return result;
}

async function importStock(
  client: { query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> },
  path: string,
) {
  const result = counters();
  let unresolved = 0;
  for await (const line of lines(path)) {
    result.found += 1;
    let batchNumber = field(line, 5, 24);
    let remainder = line.slice(24);
    const sourceMatch = remainder.match(/(\d{9})\s*$/);
    const sourceStockId = sourceMatch?.[1] ?? "";
    if (sourceMatch) remainder = remainder.slice(0, sourceMatch.index).trimEnd();
    const takeDecimal = () => {
      const match = remainder.match(/(\d+\.\d{2})\s*$/);
      if (!match) return "";
      remainder = remainder.slice(0, match.index).trimEnd();
      return match[1];
    };
    const salePrice = takeDecimal();
    takeDecimal(); // discount
    const cost = takeDecimal();
    const mrp = takeDecimal();
    const leading = remainder.trim().replace(/\s+/g, "");
    const compactExpiry = leading.match(/^(\d)(\d{1,2}\/\d{4})$/);
    const slashIndex = leading.indexOf("/");
    const quantity = compactExpiry?.[1] ?? (slashIndex >= 0 ? leading.slice(0, slashIndex) : leading);
    const expiry = compactExpiry?.[2] ?? (slashIndex >= 0 ? leading.slice(slashIndex - 1) : "");
    if (!sourceStockId) {
      result.skipped += 1;
      result.errors.push(`Record ${result.found}: missing stock identifier`);
      continue;
    }
    const sourceData = { fixedWidth: true, batchNumber, expiry, quantity, mrp, cost, salePrice, raw: line };
    const hash = createHash("sha256").update(JSON.stringify(sourceData)).digest("hex");
    const existing = await client.query("SELECT source_data FROM catalog_stock_batches WHERE source_stock_id = $1 LIMIT 1", [sourceStockId]);
    if (existing.rows[0] && (existing.rows[0].source_data as { raw?: string })?.raw === line) {
      result.unchanged += 1;
      continue;
    }
    unresolved += 1;
    await client.query(
      `INSERT INTO catalog_stock_batches
       (source_stock_id, product_id, batch_number, expiry_date, quantity, mrp, sale_price, cost, source_data)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (source_stock_id) DO UPDATE SET batch_number = EXCLUDED.batch_number, expiry_date = EXCLUDED.expiry_date,
         quantity = EXCLUDED.quantity, mrp = EXCLUDED.mrp, sale_price = EXCLUDED.sale_price, cost = EXCLUDED.cost,
         source_data = EXCLUDED.source_data, last_synced_at = NOW(), updated_at = NOW()`,
      [sourceStockId, batchNumber || null, parseExpiry(expiry), parseNumber(quantity), parseNumber(mrp), parseNumber(salePrice), parseNumber(cost), sourceData],
    );
    existing.rows[0] ? (result.updated += 1) : (result.inserted += 1);
  }
  return { result, unresolved };
}

export async function importFixedWidthSdfFiles(paths: SdfFilePaths): Promise<OneTimeImportSummary> {
  const started = Date.now();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const categories = await importMaster(client, paths.category, "category");
    const companies = await importMaster(client, paths.company, "company");
    const drugGroups = await importMaster(client, paths.drug, "drug");
    const products = await importProducts(client, paths.product);
    const stock = await importStock(client, paths.stock);
    const files: Record<string, ImportCounters> = {};
    for (const [key, path] of Object.entries(paths)) files[key] = { ...counters(), found: 0, inserted: 0, updated: 0, unchanged: 0, skipped: 0, errors: [`sha256:${await fileHash(path)}`] };
    await client.query("COMMIT");
    return { files, products, companies, categories, drugGroups, stock: stock.result, unresolvedStockProductReferences: stock.unresolved, durationMs: Date.now() - started };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}