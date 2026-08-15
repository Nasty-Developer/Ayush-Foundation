import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db, importErrorsTable, importFilesTable, importJobsTable, pool } from "@workspace/db";
import { previewImportFile, syncImportJob } from "./lib/catalog-sync";

const files = [
  "CATEGORY_1786745652830.SDF",
  "COMPANY_1786745652830.SDF",
  "DRUG_1786745652829.SDF",
  "PRODUCT_1786745652770.SDF",
  "STOCK_1786745652828.SDF",
];

async function main() {
  const [job] = await db.insert(importJobsTable).values({ status: "uploaded" }).returning({ id: importJobsTable.id });
  let recordsDetected = 0;
  const report: Array<{ fileName: string; type: string; bytes: number; records: number; format: string; errors: number }> = [];
  for (const fileName of files) {
    const body = readFileSync(join(process.cwd(), "../../attached_assets", fileName));
    const parsed = await previewImportFile(fileName, body);
    recordsDetected += parsed.records.length;
    report.push({ fileName, type: parsed.type, bytes: body.length, records: parsed.records.length, format: parsed.format, errors: parsed.errors.length });
    const [file] = await db.insert(importFilesTable).values({
      jobId: job.id,
      fileType: parsed.type,
      fileName,
      fileSize: body.length,
      contentHash: parsed.hash,
      sourceText: body.toString("ascii"),
      detectedDelimiter: parsed.delimiter,
      recordCount: parsed.records.length,
      mappingStatus: parsed.mappingStatus,
      mapping: parsed.mapping,
      preview: parsed.records.slice(0, 10).map((row) => Object.fromEntries(parsed.fields.map((field) => [field.name, row.values[field.index] ?? ""]))),
    }).returning({ id: importFilesTable.id });
    if (parsed.errors.length) {
      await db.insert(importErrorsTable).values(parsed.errors.map((error) => ({
        jobId: job.id,
        fileId: file.id,
        recordNumber: error.recordNumber,
        reason: error.reason,
        sourceIdentifier: null,
        sourceExcerpt: error.excerpt,
      })));
    }
  }
  await db.update(importJobsTable).set({ recordsDetected }).where(eq(importJobsTable.id, job.id));
  const summary = await syncImportJob(job.id);
  console.log(JSON.stringify({ jobId: job.id, files: report, summary }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  void pool.end();
});