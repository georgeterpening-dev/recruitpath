"""Writes Players + Summary sheets to a single .xlsx file."""

import pandas as pd
from openpyxl.utils import get_column_letter

PLAYER_COLUMNS = [
    "school_name",
    "full_name",
    "position",
    "grad_year_or_class",
    "height",
    "hometown",
    "jersey_number",
]

SUMMARY_COLUMNS = [
    "school_name",
    "roster_url",
    "players_extracted",
    "status",
    "notes",
]


def _autofit(worksheet, df: pd.DataFrame, max_width: int = 60) -> None:
    for i, col in enumerate(df.columns, start=1):
        longest = max([len(str(col))] + [len(str(v)) for v in df[col].tolist()])
        worksheet.column_dimensions[get_column_letter(i)].width = min(longest + 2, max_width)


def write_excel(player_rows: list[dict], summary_rows: list[dict], out_path: str) -> None:
    players_df = pd.DataFrame(player_rows, columns=PLAYER_COLUMNS)
    summary_df = pd.DataFrame(summary_rows, columns=SUMMARY_COLUMNS)

    with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
        players_df.to_excel(writer, sheet_name="Players", index=False)
        summary_df.to_excel(writer, sheet_name="Summary", index=False)
        _autofit(writer.sheets["Players"], players_df)
        _autofit(writer.sheets["Summary"], summary_df)
