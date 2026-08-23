import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const input = path.join(root, "attached_assets");
const output = path.join(root, "artifacts", "ayush-foundation-app", "public", "catalogue");
const pageSize = 1000;

const field = (line, start, end) => line.slice(start, end).trim();
const normalized = (value) => value.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");

function readLines(fileName) {
  return readFile(path.join(input, fileName), "utf8").then((text) => text.split(/\r?\n/).filter(Boolean));
}

async function masterMap(fileName, kind) {
  const map = new Map();
  for (const line of await readLines(fileName)) {
    const record = kind === "company"
      ? { id: field(line, 120, 126), name: field(line, 0, 30) }
      : kind === "category"
        ? { id: field(line, 35, 41), name: field(line, 0, 35) }
        : { id: field(line, 120, 124), name: field(line, 0, 60) };
    if (record.id && record.name) {
      map.set(record.id, record.name);
      map.set(normalized(record.name), record.name);
    }
  }
  return map;
}

function customerCategory(sourceCategory, dosageForm, name, drug) {
  const haystack = [sourceCategory, dosageForm, name, drug].filter(Boolean).join(" ").toLocaleLowerCase();
  if (/\b(vet|veterinary)\b/.test(haystack)) return "vet";
  if (/\b(tab|tabs|tablet|tablets)\b/.test(String(dosageForm).toLocaleLowerCase())) return "tablet";
  return "general";
}

const [companies, categories, drugs] = await Promise.all([
  masterMap("COMPANY_1787233263462.SDF", "company"),
  masterMap("CATEGORY_1787233263462.SDF", "category"),
  masterMap("DRUG_1787233263461.SDF", "drug"),
]);

const products = [];
for (const line of await readLines("PRODUCT_1787233263463.SDF")) {
  const sourceProductId = field(line, 476, 486);
  const name = field(line, 0, 74);
  if (!sourceProductId || !name) continue;
  const companySource = field(line, 75, 105);
  const categorySource = field(line, 105, 135);
  const drugSource = field(line, 135, 195);
  const packSize = field(line, 195, 230);
  const dosageForm = packSize.split(/\s+/)[0] || null;
  const company = companies.get(companySource) ?? companies.get(normalized(companySource)) ?? null;
  const category = (categories.get(categorySource) ?? categories.get(normalized(categorySource)) ?? categorySource) || null;
  const drug = (drugs.get(drugSource) ?? drugs.get(normalized(drugSource)) ?? drugSource) || null;
  const audience = customerCategory(category, dosageForm, name, drug);
  products.push({
    id: products.length + 1,
    sourceProductId,
    name,
    company,
    drug,
    sourceCategory: category,
    customerCategory: audience,
    categoryDisplayName: audience === "tablet" ? "Tablet Medicines" : audience === "vet" ? "Vet Medicines" : "General Medicines",
    dosageForm,
    packSize: packSize || null,
    imageUrl: null,
    salePrice: null,
    mrp: null,
    quantity: null,
    prescriptionRequired: false,
    productInfo: { sourceCategory: category, sourceDrug: drug, sourceCompany: company, packSize: packSize || null },
  });
}

// Veterinary records stay out of the customer catalogue until the Foundation
// has a verified veterinary merchandising source.
const customerProducts = products.filter((product) => product.customerCategory !== "vet");
customerProducts.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
customerProducts.forEach((product, index) => { product.id = index + 1; });

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, "pages"), { recursive: true });

const pages = [];
for (let offset = 0; offset < products.length; offset += pageSize) {
  const page = customerProducts.slice(offset, offset + pageSize);
  const pageNumber = pages.length + 1;
  const file = `page-${String(pageNumber).padStart(3, "0")}.json`;
  await writeFile(path.join(output, "pages", file), JSON.stringify(page));
  pages.push({ file, page: pageNumber, startId: page[0]?.id ?? null, endId: page.at(-1)?.id ?? null, count: page.length });
}

const searchIndex = customerProducts.map(({ id, sourceProductId, name, company, drug, sourceCategory, customerCategory }) => ({
  id, sourceProductId, name, company, drug, sourceCategory, customerCategory,
}));
await writeFile(path.join(output, "search-index.json"), JSON.stringify(searchIndex));

const categoryCounts = customerProducts.reduce((counts, product) => {
  counts[product.customerCategory] += 1;
  return counts;
}, { tablet: 0, vet: 0, general: 0 });
await writeFile(path.join(output, "manifest.json"), JSON.stringify({
  version: 1,
  source: "Ayush Foundation imported PRODUCT, COMPANY, CATEGORY, and DRUG SDF records",
  total: customerProducts.length,
  pageSize,
  totalPages: pages.length,
  categories: [
    { id: "tablet", name: "Tablet Medicines", displayName: "Tablet Medicines", count: categoryCounts.tablet },
    { id: "vet", name: "Vet Medicines", displayName: "Vet Medicines", count: 0 },
    { id: "general", name: "General Medicines", displayName: "General Medicines", count: categoryCounts.general },
  ],
  pages,
}));
console.log(`Generated ${customerProducts.length} customer products across ${pages.length} pages.`);