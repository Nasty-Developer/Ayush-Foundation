import crypto from "node:crypto";

export const SDF_TYPES = ["PRODUCT", "STOCK", "DRUG", "COMPANY", "CATEGORY"] as const;
export type SdfType = (typeof SDF_TYPES)[number];

type ParsedRow = { recordNumber: number; values: string[]; raw: string };
export type SdfField = { name: string; index: number; sample: string };
export type ParsedSdf = {
  type: SdfType;
  delimiter: string | null;
  records: ParsedRow[];
  fields: SdfField[];
  headers: string[] | null;
  mapping: Record<string, number>;
  mappingStatus: "verified_from_header" | "review_required";
  errors: Array<{ recordNumber: number; reason: string; excerpt: string }>;
  hash: string;
};

const aliases: Record<SdfType, Record<string, string[]>> = {
  CATEGORY: {
    sourceId: ["id", "categoryid", "categorycode", "code", "catid"],
    name: ["name", "category", "categoryname", "description"],
  },
  COMPANY: {
    sourceId: ["id", "companyid", "companycode", "code", "manufacturerid"],
    name: ["name", "company", "companyname", "manufacturer", "manufacturername"],
    code: ["code", "companycode"],
  },
  DRUG: {
    sourceId: ["id", "drugid", "drugcode", "code", "genericid"],
    name: ["name", "drug", "drugname", "generic", "genericname", "composition"],
  },
  PRODUCT: {
    sourceId: ["id", "productid", "productcode", "itemid", "code", "sku"],
    name: ["name", "product", "productname", "item", "itemname", "medicine", "medicinename"],
    companyRef: ["companyid", "company", "companycode", "manufacturer", "manufacturerid"],
    categoryRef: ["categoryid", "category", "categorycode", "categoryname", "catid"],
    drugRef: ["drugid", "drug", "drugcode", "generic", "genericid", "genericname"],
    dosageForm: ["dosage", "dosageform", "form", "packtype", "unit"],
    packSize: ["pack", "packsize", "packinformation", "packing"],
    sourceCategory: ["sourcecategory", "category", "categoryname", "categorytype"],
  },
  STOCK: {
    sourceId: ["id", "stockid", "stockcode", "inventoryid", "batchid"],
    productRef: ["productid", "product", "productcode", "itemid", "itemcode", "sku"],
    batch: ["batch", "batchno", "batchnumber", "lot", "lotno"],
    expiry: ["expiry", "expirydate", "expdate", "expire"],
    quantity: ["quantity", "qty", "stock", "units", "balance"],
    mrp: ["mrp", "maximumretailprice"],
    salePrice: ["saleprice", "sellingprice", "sellprice", "rate"],
    cost: ["cost", "costprice", "purchaseprice"],
  },
};

function canonical(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function detectType(fileName: string): SdfType {
  const base = fileName.toUpperCase().replace(/[^A-Z]/g, "");
  const match = SDF_TYPES.find((type) => base.includes(type));
  if (!match) throw new Error("Filename must identify PRODUCT, STOCK, DRUG, COMPANY, or CATEGORY.");
  return match;
}

function splitStructuredRecord(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (!quoted && char === delimiter) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

function detectDelimiter(lines: string[]): string | null {
  const candidates = ["\t", "|", "\x01", "\x02", ";", ","];
  let best: { delimiter: string; score: number } | null = null;
  for (const delimiter of candidates) {
    const counts = lines.slice(0, 100).map((line) => splitStructuredRecord(line, delimiter).length);
    const multi = counts.filter((count) => count > 1);
    if (multi.length < Math.max(2, Math.floor(counts.length * 0.65))) continue;
    const frequency = new Map<number, number>();
    for (const count of multi) frequency.set(count, (frequency.get(count) ?? 0) + 1);
    const [mode, modeCount] = [...frequency.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
    const score = modeCount * mode + (delimiter === "\t" || delimiter === "\x01" ? 20 : 0);
    if (!best || score > best.score) best = { delimiter, score };
  }
  return best?.delimiter ?? null;
}

function looksLikeHeader(values: string[]): boolean {
  const normalized = values.map(canonical);
  const known = Object.values(aliases).flatMap((group) => Object.values(group).flat()).map(canonical);
  return normalized.filter((value) => known.includes(value)).length >= 1;
}

function findMapping(type: SdfType, headers: string[] | null): Record<string, number> {
  if (!headers) return {};
  const result: Record<string, number> = {};
  const normalizedHeaders = headers.map(canonical);
  for (const [field, fieldAliases] of Object.entries(aliases[type])) {
    const index = normalizedHeaders.findIndex((header) => fieldAliases.map(canonical).includes(header));
    if (index >= 0) result[field] = index;
  }
  return result;
}

export function parseSdf(fileName: string, source: Buffer | string): ParsedSdf {
  const type = detectType(fileName);
  const text = typeof source === "string" ? source : source.toString("utf8").replace(/^\uFEFF/, "");
  const hash = crypto.createHash("sha256").update(text).digest("hex");
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim() !== "");
  const delimiter = detectDelimiter(lines);
  const firstValues = delimiter ? splitStructuredRecord(lines[0], delimiter) : [lines[0].trim()];
  const headers = delimiter && looksLikeHeader(firstValues) ? firstValues : null;
  const dataLines = headers ? lines.slice(1) : lines;
  const records: ParsedRow[] = [];
  const errors: ParsedSdf["errors"] = [];
  let expectedWidth: number | null = headers?.length ?? null;
  for (let index = 0; index < dataLines.length; index += 1) {
    const raw = dataLines[index];
    const values = delimiter ? splitStructuredRecord(raw, delimiter) : [raw.trim()];
    expectedWidth ??= values.length;
    if (delimiter && values.length !== expectedWidth) {
      errors.push({ recordNumber: index + 1, reason: `Expected ${expectedWidth} fields but found ${values.length}.`, excerpt: raw.slice(0, 240) });
      continue;
    }
    records.push({ recordNumber: index + 1, values, raw });
  }
  const mapping = findMapping(type, headers);
  const fields = (headers ?? (records[0]?.values.map((_, index) => `field_${index + 1}`) ?? [])).map((name, index) => ({
    name,
    index,
    sample: records[0]?.values[index] ?? "",
  }));
  return {
    type,
    delimiter,
    records,
    fields,
    headers,
    mapping,
    mappingStatus: headers && Object.keys(mapping).length >= (type === "PRODUCT" ? 2 : 1) ? "verified_from_header" : "review_required",
    errors,
    hash,
  };
}

export function getMapped(row: ParsedRow, mapping: Record<string, number>, key: string): string {
  const index = mapping[key];
  return index === undefined ? "" : (row.values[index] ?? "").trim();
}

export function previewOf(parsed: ParsedSdf, limit = 10) {
  return parsed.records.slice(0, limit).map((record) => Object.fromEntries(parsed.fields.map((field) => [field.name, record.values[field.index] ?? ""])));
}

export function mappingFor(type: SdfType) {
  return aliases[type];
}

export { detectType };