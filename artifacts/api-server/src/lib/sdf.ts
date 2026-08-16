import crypto from "node:crypto";

export const SDF_TYPES = ["PRODUCT", "STOCK", "DRUG", "COMPANY", "CATEGORY"] as const;
export type SdfType = (typeof SDF_TYPES)[number];
export const ALLOWED_SDF_UPLOAD_NAMES = new Set(SDF_TYPES.map((type) => `${type}.SDF`));

type ParsedRow = { recordNumber: number; values: string[]; raw: string };
export type SdfField = { name: string; index: number; sample: string; start?: number; end?: number };
export type SdfFormat = "fixed_width" | "structured";
export type ParsedSdf = {
  type: SdfType;
  format: SdfFormat;
  width: number | null;
  delimiter: string | null;
  records: ParsedRow[];
  fields: SdfField[];
  headers: string[] | null;
  mapping: Record<string, number>;
  mappingStatus: "verified_from_header" | "verified_from_fixed_width" | "review_required";
  errors: Array<{ recordNumber: number; reason: string; excerpt: string }>;
  hash: string;
};

type FixedWidthField = { name: string; start: number; end: number; mappedAs?: string };
type FixedWidthProfile = { width: number; fields: FixedWidthField[] };

const fixedWidthProfiles: Record<SdfType, FixedWidthProfile> = {
  CATEGORY: {
    width: 41,
    fields: [
      { name: "name", start: 0, end: 35, mappedAs: "name" },
      { name: "sourceId", start: 39, end: 41, mappedAs: "sourceId" },
    ],
  },
  COMPANY: {
    width: 126,
    fields: [
      { name: "name", start: 0, end: 30, mappedAs: "name" },
      { name: "code", start: 30, end: 60, mappedAs: "code" },
      { name: "sourceId", start: 122, end: 126, mappedAs: "sourceId" },
    ],
  },
  DRUG: {
    width: 124,
    fields: [
      { name: "name", start: 0, end: 60, mappedAs: "name" },
      { name: "flags", start: 60, end: 120 },
      { name: "sourceId", start: 122, end: 124, mappedAs: "sourceId" },
    ],
  },
  PRODUCT: {
    width: 486,
    fields: [
      { name: "name", start: 0, end: 74, mappedAs: "name" },
      { name: "sourceFlag", start: 74, end: 75 },
      { name: "companyName", start: 75, end: 105, mappedAs: "companyName" },
      { name: "categoryName", start: 105, end: 130, mappedAs: "categoryName" },
      { name: "drugName", start: 130, end: 190, mappedAs: "drugName" },
      { name: "dosagePack", start: 190, end: 205, mappedAs: "dosagePack" },
      { name: "unitCount", start: 205, end: 210 },
      { name: "packDetail", start: 210, end: 230, mappedAs: "packDetail" },
      { name: "legacyField230", start: 230, end: 236 },
      { name: "legacyField236", start: 236, end: 243 },
      { name: "legacyField243", start: 243, end: 248 },
      { name: "legacyField248", start: 248, end: 253 },
      { name: "legacyField253", start: 253, end: 258 },
      { name: "legacyField258", start: 258, end: 263 },
      { name: "legacyField263", start: 263, end: 270 },
      { name: "flags", start: 270, end: 280 },
      { name: "sourceId", start: 480, end: 486, mappedAs: "sourceId" },
    ],
  },
  STOCK: {
    width: 81,
    fields: [
      { name: "batch", start: 5, end: 20, mappedAs: "batch" },
      { name: "productRef", start: 5, end: 10, mappedAs: "productRef" },
      { name: "quantity", start: 20, end: 25, mappedAs: "quantity" },
      { name: "expiry", start: 25, end: 32, mappedAs: "expiry" },
      { name: "batchQuantity", start: 31, end: 34 },
      { name: "mrp", start: 34, end: 40, mappedAs: "mrp" },
      { name: "cost", start: 40, end: 48, mappedAs: "cost" },
      { name: "discount", start: 48, end: 53 },
      { name: "priceFlag", start: 53, end: 55 },
      { name: "salePrice", start: 55, end: 61, mappedAs: "salePrice" },
      { name: "stockFlag", start: 61, end: 65 },
      { name: "sourceId", start: 65, end: 75, mappedAs: "sourceId" },
    ],
  },
};

const aliases: Record<SdfType, Record<string, string[]>> = {
  CATEGORY: { sourceId: ["id", "categoryid", "categorycode", "code", "catid"], name: ["name", "category", "categoryname", "description"] },
  COMPANY: { sourceId: ["id", "companyid", "companycode", "code", "manufacturerid"], name: ["name", "company", "companyname", "manufacturer", "manufacturername"], code: ["code", "companycode"] },
  DRUG: { sourceId: ["id", "drugid", "drugcode", "code", "genericid"], name: ["name", "drug", "drugname", "generic", "genericname", "composition"] },
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

export function detectUploadType(fileName: string): SdfType {
  const normalizedName = fileName.trim().toUpperCase();
  if (!normalizedName.endsWith(".SDF") || !ALLOWED_SDF_UPLOAD_NAMES.has(normalizedName)) {
    throw new Error("Filename must be exactly PRODUCT.SDF, STOCK.SDF, DRUG.SDF, COMPANY.SDF, or CATEGORY.SDF.");
  }
  return normalizedName.slice(0, -4) as SdfType;
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

function fixedWidthParse(type: SdfType, lines: string[], hash: string): ParsedSdf | null {
  const profile = fixedWidthProfiles[type];
  const nonEmpty = lines.filter((line) => line.trim() !== "");
  const validLines = nonEmpty.filter((line) => line.length === profile.width);
  if (!validLines.length || validLines.length / nonEmpty.length < 0.95) return null;

  const fields: SdfField[] = profile.fields.map((field, index) => ({
    name: field.name,
    index,
    start: field.start,
    end: field.end,
    sample: validLines[0].slice(field.start, field.end).trim(),
  }));
  const mapping: Record<string, number> = {};
  for (const field of profile.fields) if (field.mappedAs) mapping[field.mappedAs] = field.name === "sourceId" ? fields.findIndex((item) => item.name === "sourceId") : fields.findIndex((item) => item.name === field.name);

  const errors = nonEmpty.flatMap((raw, index) => raw.length === profile.width ? [] : [{
    recordNumber: index + 1,
    reason: `Expected fixed-width record length ${profile.width}, found ${raw.length}.`,
    excerpt: raw.slice(0, 240),
  }]);
  const records = nonEmpty.flatMap((raw, index) => raw.length === profile.width ? [{
    recordNumber: index + 1,
    values: profile.fields.map((field) => {
      if (field.mappedAs === "sourceId") {
        // COMPANY.SDF and DRUG.SDF right-align numeric identifiers inside
        // padded tails; slicing a fixed window truncates IDs such as 1101.
        return raw.match(/(\d+)\s*$/)?.[1] ?? "";
      }
      return raw.slice(field.start, field.end).trim();
    }),
    raw,
  }] : []);
  return {
    type,
    format: "fixed_width",
    width: profile.width,
    delimiter: null,
    records,
    fields,
    headers: null,
    mapping,
    mappingStatus: "verified_from_fixed_width",
    errors,
    hash,
  };
}

export function parseSdf(fileName: string, source: Buffer | string): ParsedSdf {
  const type = detectType(fileName);
  const text = typeof source === "string" ? source.replace(/^\uFEFF/, "") : source.toString("ascii").replace(/^\uFEFF/, "");
  const hash = crypto.createHash("sha256").update(text).digest("hex");
  const lines = text.split(/\r\n|\n|\r/);
  const fixed = fixedWidthParse(type, lines, hash);
  if (fixed) return fixed;

  const dataLines = lines.filter((line) => line.trim() !== "");
  const delimiter = detectDelimiter(dataLines);
  const firstValues = delimiter ? splitStructuredRecord(dataLines[0], delimiter) : [dataLines[0]?.trim() ?? ""];
  const headers = delimiter && looksLikeHeader(firstValues) ? firstValues : null;
  const structuredLines = headers ? dataLines.slice(1) : dataLines;
  const records: ParsedRow[] = [];
  const errors: ParsedSdf["errors"] = [];
  let expectedWidth: number | null = headers?.length ?? null;
  for (let index = 0; index < structuredLines.length; index += 1) {
    const raw = structuredLines[index];
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
    format: "structured",
    width: null,
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
  return fixedWidthProfiles[type] ?? aliases[type];
}

export { detectType };