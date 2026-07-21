/**
 * seed-school-links.mjs
 * Reads the school links CSV and updates recruitingQuestionnaireUrl + athleticsWebsiteUrl
 * for every school in the DB by name matching.
 *
 * Usage: node scripts/seed-school-links.mjs
 */

import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const CSV_PATH = "/home/ubuntu/upload/Untitledspreadsheet-Sheet1(5).csv";

// Normalize a school name for fuzzy matching
function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/['']/g, "'")
    .replace(/\bst\.\b/g, "st")
    .replace(/\buniversity\b/g, "university")
    .replace(/\bcollege\b/g, "college")
    .replace(/\bthe\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);

  // Parse CSV — deduplicate by school name, taking first non-empty URL per school
  const csvText = readFileSync(CSV_PATH, "utf-8");
  const lines = csvText.split("\n").filter((l) => l.trim());

  // Map: normalizedName -> { recruitingUrl, athleticsUrl }
  const csvMap = new Map();

  for (const line of lines) {
    // CSV has 15 columns, split carefully (no quoted fields in this CSV)
    const cols = line.split(",");
    const schoolName = (cols[0] || "").trim();
    const recruitingUrl = (cols[10] || "").trim();
    const athleticsUrl = (cols[14] || "").trim();

    if (!schoolName) continue;

    const key = normalizeName(schoolName);
    if (!csvMap.has(key)) {
      csvMap.set(key, { schoolName, recruitingUrl: "", athleticsUrl: "" });
    }
    const entry = csvMap.get(key);
    // Take first non-empty URL found for each school
    if (!entry.recruitingUrl && recruitingUrl) entry.recruitingUrl = recruitingUrl;
    if (!entry.athleticsUrl && athleticsUrl) entry.athleticsUrl = athleticsUrl;
  }

  console.log(`Parsed ${csvMap.size} unique schools from CSV`);

  // Fetch all schools from DB
  const [dbSchools] = await conn.query("SELECT id, name FROM schools");
  console.log(`Found ${dbSchools.length} schools in DB`);

  let updated = 0;
  let notFound = 0;
  const notFoundList = [];

  for (const dbSchool of dbSchools) {
    const dbKey = normalizeName(dbSchool.name);

    // Try exact normalized match first
    let csvEntry = csvMap.get(dbKey);

    // If no exact match, try partial matching (DB name contains CSV name or vice versa)
    if (!csvEntry) {
      for (const [csvKey, entry] of csvMap.entries()) {
        if (dbKey.includes(csvKey) || csvKey.includes(dbKey)) {
          csvEntry = entry;
          break;
        }
      }
    }

    if (csvEntry && (csvEntry.recruitingUrl || csvEntry.athleticsUrl)) {
      await conn.query(
        "UPDATE schools SET recruitingQuestionnaireUrl = ?, athleticsWebsiteUrl = ? WHERE id = ?",
        [
          csvEntry.recruitingUrl || null,
          csvEntry.athleticsUrl || null,
          dbSchool.id,
        ]
      );
      updated++;
    } else {
      notFound++;
      notFoundList.push(dbSchool.name);
    }
  }

  console.log(`\nResults:`);
  console.log(`  Updated: ${updated} schools`);
  console.log(`  Not found in CSV: ${notFound} schools`);
  if (notFoundList.length > 0) {
    console.log(`\nSchools not matched in CSV:`);
    notFoundList.forEach((n) => console.log(`  - ${n}`));
  }

  await conn.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
