/**
 * seed-missing-schools.mjs
 *
 * Adds the 33 schools missing from the DB that are present in the coach CSV.
 * Each school gets:
 *   - A row in the schools table (hasRosterData=false, sortOrder=999)
 *   - All coaches from the CSV inserted into the coaches table
 */

import { createConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MISSING_JSON = "/home/ubuntu/recruitpath/scripts/missing-schools.json";

function makeSchoolId(name) {
  return (
    "mvb-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 30)
  );
}

async function main() {
  const schools = JSON.parse(fs.readFileSync(MISSING_JSON, "utf-8"));
  const conn = await createConnection(process.env.DATABASE_URL);

  let schoolsAdded = 0;
  let coachesAdded = 0;
  const addedSchools = [];

  for (const school of schools) {
    const schoolId = makeSchoolId(school.name);

    // Check if already exists (by id or name)
    const [existing] = await conn.execute(
      "SELECT id FROM schools WHERE id = ? OR name = ?",
      [schoolId, school.name]
    );
    if (existing.length > 0) {
      console.log(`  SKIP (already exists): ${school.name}`);
      continue;
    }

    // Find head coach
    const headCoach =
      school.coaches.find((c) =>
        (c.title || "").toLowerCase().includes("head")
      ) || school.coaches[0];

    // Insert school
    await conn.execute(
      `INSERT INTO schools (
        id, name, division, conference, hasRosterData,
        athleticsDomain, coachName, coachTitle, coachEmail,
        recruitingQuestionnaireUrl, athleticsWebsiteUrl,
        sortOrder, isTestSchool
      ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 999, 0)`,
      [
        schoolId,
        school.name,
        school.division,
        school.conference || null,
        school.athleticsDomain || null,
        headCoach
          ? `${headCoach.firstName} ${headCoach.lastName}`.trim()
          : null,
        headCoach ? headCoach.title : null,
        headCoach ? headCoach.email : null,
        school.recruitingQuestionnaireUrl || null,
        school.athleticsWebsiteUrl || null,
      ]
    );
    schoolsAdded++;
    addedSchools.push(school.name);

    // Insert all coaches
    for (let i = 0; i < school.coaches.length; i++) {
      const coach = school.coaches[i];
      if (!coach.firstName && !coach.lastName) continue;
      await conn.execute(
        `INSERT INTO coaches (schoolId, firstName, lastName, position, email, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          schoolId,
          coach.firstName || "",
          coach.lastName || "",
          coach.title || "",
          coach.email || null,
          i,
        ]
      );
      coachesAdded++;
    }

    console.log(
      `  ADDED: ${school.name} (${school.division}) | ${school.coaches.length} coaches`
    );
  }

  // Verify total count
  const [countResult] = await conn.execute(
    "SELECT COUNT(*) as total FROM schools WHERE isTestSchool = 0 OR isTestSchool IS NULL"
  );
  const total = countResult[0].total;

  await conn.end();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Schools added: ${schoolsAdded}`);
  console.log(`Coaches added: ${coachesAdded}`);
  console.log(`Total schools in DB now: ${total}`);
  console.log(`${"=".repeat(60)}`);

  console.log(`\nFull list of added schools:`);
  addedSchools.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
}

main().catch(console.error);
