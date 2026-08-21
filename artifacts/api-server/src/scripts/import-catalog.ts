import { importFixedWidthSdfFiles } from "../lib/sdf-one-time-import";

const args = process.argv.slice(2).filter((argument) => argument !== "--");
const [product, stock, company, category, drug] = args;
if (![product, stock, company, category, drug].every(Boolean)) {
  throw new Error("Usage: import-catalog PRODUCT.SDF STOCK.SDF COMPANY.SDF CATEGORY.SDF DRUG.SDF");
}

const summary = await importFixedWidthSdfFiles({ product, stock, company, category, drug });
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);