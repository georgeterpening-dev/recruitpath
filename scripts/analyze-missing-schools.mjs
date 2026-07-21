/**
 * analyze-missing-schools.mjs
 *
 * Compares the coach CSV against the DB schools table to find missing schools.
 * Uses normalized name matching (lowercase, strip punctuation, handle St./Saint, etc.)
 */

import fs from "fs";
import path from "path";
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const CSV_PATH = "/home/ubuntu/upload/RecruitPathDatabase-Sheet1.csv";

// ─── Column indices (0-based) ───────────────────────────────────────────────
// 0: School Name
// 1: City
// 2: State
// 3: Division (e.g. "NCAA D1")
// 4: Conference
// 5: Coach First Name
// 6: Coach Last Name
// 7: Coach Title
// 8: Coach Email
// 9: (unknown)
// 10: Questionnaire URL
// 11-13: (unknown)
// 14: Athletics Website URL

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/\bst\.\b/g, "saint")
    .replace(/\bst\b/g, "saint")
    .replace(/\b&\b/g, "and")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  // ── 1. Read CSV ────────────────────────────────────────────────────────────
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  // Manual CSV parser that handles quoted fields
  function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }
  const rows = csvContent
    .split("\n")
    .filter((l) => l.trim())
    .map(parseCSVLine);

  // Build map: normalizedName -> first row with that school (for metadata)
  const csvSchoolMap = new Map(); // normalizedName -> { raw, rows[] }
  const csvSchoolOrder = []; // to preserve first-seen order

  for (const row of rows) {
    const rawName = (row[0] || "").trim();
    if (!rawName) continue;
    const norm = normalize(rawName);
    if (!csvSchoolMap.has(norm)) {
      csvSchoolMap.set(norm, { raw: rawName, rows: [] });
      csvSchoolOrder.push(norm);
    }
    csvSchoolMap.get(norm).rows.push(row);
  }

  console.log(`CSV unique schools: ${csvSchoolMap.size}`);

  // ── 2. Query DB ────────────────────────────────────────────────────────────
  const conn = await createConnection(process.env.DATABASE_URL);
  const [dbRows] = await conn.execute(
    "SELECT id, name FROM schools WHERE isTestSchool = 0 OR isTestSchool IS NULL ORDER BY name"
  );
  await conn.end();

  const dbSchoolMap = new Map(); // normalizedName -> { id, name }
  for (const row of dbRows) {
    const norm = normalize(row.name);
    dbSchoolMap.set(norm, { id: row.id, name: row.name });
  }

  console.log(`DB schools: ${dbSchoolMap.size}`);

  // ── 3. Find missing ────────────────────────────────────────────────────────
  const missing = [];
  for (const norm of csvSchoolOrder) {
    if (!dbSchoolMap.has(norm)) {
      missing.push({ norm, ...csvSchoolMap.get(norm) });
    }
  }

  console.log(`\nMissing schools (${missing.length}):`);
  for (const s of missing) {
    const headCoach = s.rows.find(
      (r) => (r[7] || "").toLowerCase().includes("head")
    );
    const division = (headCoach || s.rows[0])[3] || "";
    const conference = (headCoach || s.rows[0])[4] || "";
    const city = (headCoach || s.rows[0])[1] || "";
    const state = (headCoach || s.rows[0])[2] || "";
    console.log(
      `  "${s.raw}" | ${division} | ${conference} | ${city}, ${state}`
    );
  }

  // ── 4. Also show which CSV names are close to DB names (fuzzy check) ───────
  console.log("\n--- Possible near-matches (manual review) ---");
  for (const s of missing) {
    const words = s.norm.split(" ").filter((w) => w.length > 3);
    const candidates = [];
    for (const [dbNorm, dbInfo] of dbSchoolMap) {
      const matchCount = words.filter((w) => dbNorm.includes(w)).length;
      if (matchCount >= 2) {
        candidates.push({ dbName: dbInfo.name, matchCount });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.matchCount - a.matchCount);
      console.log(
        `  "${s.raw}" → possible match: "${candidates[0].dbName}"`
      );
    }
  }

  // ── 5. Write JSON output for the seed script ───────────────────────────────
  const output = missing.map((s) => {
    const headCoachRow =
      s.rows.find((r) => (r[7] || "").toLowerCase().includes("head")) ||
      s.rows[0];
    const allCoaches = s.rows.map((r) => ({
      firstName: (r[5] || "").trim(),
      lastName: (r[6] || "").trim(),
      title: (r[7] || "").trim(),
      email: (r[8] || "").trim(),
    }));
    const athleticsUrl = (headCoachRow[14] || headCoachRow[15] || "").trim();
    // Extract domain from athletics URL
    let athleticsDomain = "";
    try {
      if (athleticsUrl) {
        const url = new URL(athleticsUrl);
        athleticsDomain = url.hostname.replace(/^www\./, "");
      }
    } catch {}
    const questionnaireUrl = (headCoachRow[10] || "").trim();

    return {
      name: s.raw,
      division: (headCoachRow[3] || "").trim(),
      conference: (headCoachRow[4] || "").trim(),
      city: (headCoachRow[1] || "").trim(),
      state: (headCoachRow[2] || "").trim(),
      coachName: `${headCoachRow[5] || ""} ${headCoachRow[6] || ""}`.trim(),
      coachEmail: (headCoachRow[8] || "").trim(),
      coachTitle: (headCoachRow[7] || "").trim(),
      athleticsDomain,
      athleticsWebsiteUrl: athleticsUrl,
      recruitingQuestionnaireUrl: questionnaireUrl,
      coaches: allCoaches,
    };
  });

  fs.writeFileSync(
    "/home/ubuntu/recruitpath/scripts/missing-schools.json",
    JSON.stringify(output, null, 2)
  );
  console.log(
    `\nWrote ${output.length} missing schools to scripts/missing-schools.json`
  );
}

main().catch(console.error);
