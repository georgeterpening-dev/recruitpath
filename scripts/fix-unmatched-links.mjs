/**
 * fix-unmatched-links.mjs
 * Manually updates the 10 schools that weren't matched by the main seed script
 * due to abbreviated names in the DB vs full names in the CSV.
 */

import { createConnection } from "mysql2/promise";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const MANUAL_OVERRIDES = [
  {
    dbName: "BYU",
    recruitingUrl: null,
    athleticsUrl: "https://byucougars.com/home/m-volleyball",
  },
  {
    dbName: "Cal Lutheran",
    recruitingUrl: "https://clusports.com/sports/2023/7/21/recruit-me.aspx",
    athleticsUrl: "https://www.clusports.com/sports/mvball/index",
  },
  {
    dbName: "Long Beach State",
    recruitingUrl: "https://questionnaires.armssoftware.com/afaa9365a2a8",
    athleticsUrl: "https://longbeachstate.com/sports/mens-volleyball",
  },
  {
    dbName: "Loyola Chicago",
    recruitingUrl: "https://questionnaires.armssoftware.com/51231a28c567",
    athleticsUrl: "https://loyolaramblers.com/sports/mens-volleyball",
  },
  {
    dbName: "Messiah University",
    recruitingUrl: "https://gomessiah.com/sports/2014/8/5/GEN_0805140853",
    athleticsUrl: "https://gomessiah.com/sports/mens-volleyball",
  },
  {
    dbName: "NYU",
    recruitingUrl: "http://www.gonyuathletics.com/sports/2008/8/26/MVB_0826080928.aspx?path=mvball",
    athleticsUrl: "https://gonyuathletics.com/sports/mens-volleyball",
  },
  {
    dbName: "St. Joseph's University LI",
    recruitingUrl: "https://questionnaires.armssoftware.com/5ec729e94de9",
    athleticsUrl: "https://sjliathletics.com/sports/mens-volleyball",
  },
  {
    dbName: "UC Irvine",
    recruitingUrl: "https://questionnaires.armssoftware.com/acf040261cd2",
    athleticsUrl: "https://ucirvinesports.com/sports/mens-volleyball",
  },
  {
    dbName: "UC Santa Barbara",
    recruitingUrl: "https://questionnaires.armssoftware.com/0f68c872af4f",
    athleticsUrl: "https://www.ucsbgauchos.com/sports/m-volley/index",
  },
  {
    dbName: "UC San Diego",
    recruitingUrl: "https://questionnaires.armssoftware.com/2b5aefc0ee4d?DB_OEM_ID=5800",
    athleticsUrl: "https://ucsdtritons.com/sports/mens-volleyball",
  },
];

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);

  let updated = 0;
  for (const override of MANUAL_OVERRIDES) {
    const [result] = await conn.query(
      "UPDATE schools SET recruitingQuestionnaireUrl = ?, athleticsWebsiteUrl = ? WHERE name = ?",
      [override.recruitingUrl, override.athleticsUrl, override.dbName]
    );
    if (result.affectedRows > 0) {
      console.log(`  ✓ Updated: ${override.dbName}`);
      updated++;
    } else {
      console.log(`  ✗ Not found in DB: ${override.dbName}`);
    }
  }

  console.log(`\nManually updated ${updated} schools.`);
  await conn.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
