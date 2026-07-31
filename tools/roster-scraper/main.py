"""Pilot roster scraper: processes exactly HARD_LIMIT schools, then stops.

Usage:
    python main.py

Requires ANTHROPIC_API_KEY in .env (see .env.example) and the Playwright
Chromium browser installed (`python -m playwright install chromium`, or set
PLAYWRIGHT_CHROMIUM_PATH to an existing binary).
"""

import random
import time
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

from schools import PILOT_SCHOOLS, HARD_LIMIT
from scraper import scrape_school, RosterNotFoundError
from claude_parser import parse_roster
from excel_writer import write_excel

MIN_DELAY_S = 2.5
MAX_DELAY_S = 4.5


def run() -> str:
    schools = PILOT_SCHOOLS[:HARD_LIMIT]
    assert len(schools) <= HARD_LIMIT, "refusing to exceed the pilot hard limit"

    player_rows = []
    summary_rows = []

    for i, school in enumerate(schools, start=1):
        name, url = school["name"], school["url"]
        print(f"[{i}/{len(schools)}] {name} ...", flush=True)

        roster_url = ""
        status = "Failed"
        reason = ""
        n_players = 0

        try:
            result = scrape_school(url)
            roster_url = result.roster_url

            parsed = parse_roster(name, result.raw_content)
            n_players = len(parsed.players)

            for p in parsed.players:
                player_rows.append(
                    {
                        "school_name": name,
                        "full_name": p.get("full_name"),
                        "position": p.get("position"),
                        "grad_year_or_class": p.get("grad_year_or_class"),
                        "height": p.get("height"),
                        "hometown": p.get("hometown"),
                        "jersey_number": p.get("jersey_number"),
                    }
                )

            if n_players == 0:
                status = "Partial"
                reason = parsed.notes or "Roster page found but no players could be confidently extracted"
            elif parsed.ambiguous:
                status = "Partial"
                reason = parsed.notes or "Extraction required judgment calls; please verify manually"
            else:
                status = "Success"
                reason = parsed.notes or f"Extracted cleanly ({result.discovery_note})"

        except RosterNotFoundError as e:
            status = "Failed"
            reason = f"Could not locate/load roster page: {e}"
        except Exception as e:  # noqa: BLE001 - keep the pilot loop resilient
            status = "Failed"
            reason = f"Unexpected error: {type(e).__name__}: {e}"

        summary_rows.append(
            {
                "school_name": name,
                "roster_url": roster_url,
                "players_extracted": n_players,
                "status": status,
                "notes": reason,
            }
        )
        print(f"    -> {status} ({n_players} players): {reason}")

        if i < len(schools):
            time.sleep(random.uniform(MIN_DELAY_S, MAX_DELAY_S))

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = f"roster_pilot_{timestamp}.xlsx"
    write_excel(player_rows, summary_rows, out_path)

    print(f"\nSTOPPED after {len(schools)} schools (hard limit). Output: {out_path}")
    print(f"Total players extracted: {len(player_rows)}")
    failed = [r for r in summary_rows if r["status"] == "Failed"]
    partial = [r for r in summary_rows if r["status"] == "Partial"]
    print(f"Failed: {len(failed)}, Partial: {len(partial)}, Success: {len(summary_rows) - len(failed) - len(partial)}")

    return out_path


if __name__ == "__main__":
    run()
