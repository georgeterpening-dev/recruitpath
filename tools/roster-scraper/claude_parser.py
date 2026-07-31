"""Turns raw scraped roster content into structured player records via Claude."""

import os
from dataclasses import dataclass, field

from anthropic import Anthropic

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")

PLAYER_SCHEMA = {
    "type": "object",
    "properties": {
        "full_name": {"type": "string"},
        "position": {"type": ["string", "null"]},
        "grad_year_or_class": {"type": ["string", "null"]},
        "height": {"type": ["string", "null"]},
        "hometown": {"type": ["string", "null"]},
        "jersey_number": {"type": ["string", "null"]},
    },
    "required": ["full_name"],
}

EXTRACT_TOOL = {
    "name": "record_roster",
    "description": "Record the men's volleyball roster extracted from page content.",
    "input_schema": {
        "type": "object",
        "properties": {
            "players": {"type": "array", "items": PLAYER_SCHEMA},
            "ambiguous": {
                "type": "boolean",
                "description": "True if the page format was confusing, mixed multiple teams/sports, or extraction required guesswork.",
            },
            "notes": {
                "type": "string",
                "description": (
                    "Brief explanation of extraction quality: what was clean, what was uncertain, "
                    "or why zero players were found. Empty string if nothing noteworthy."
                ),
            },
        },
        "required": ["players", "ambiguous", "notes"],
    },
}

SYSTEM_PROMPT = """You extract men's college volleyball roster data from raw scraped web page \
content (HTML table fragments and/or visible page text) and record it via the record_roster tool.

Rules:
- Only include players who are CLEARLY listed by name in the content. Never invent, guess, or \
infer a player who isn't explicitly present.
- Capture position and grad_year_or_class exactly as shown on the page (e.g. "OH", "Junior", \
"Jr.", "2027") -- do not normalize or reinterpret these values.
- If a field isn't shown for a player, use null for it rather than guessing.
- If the content includes other teams (e.g. women's volleyball) or non-roster content (news, \
coaches-only bios), only extract the men's volleyball players and set ambiguous=true with a note \
explaining what you excluded.
- If the content doesn't look like a roster at all, return an empty players list with \
ambiguous=true and a note explaining what the content actually appeared to be.
- Set ambiguous=true whenever you had to make a judgment call to produce the result."""


@dataclass
class ParsedRoster:
    players: list = field(default_factory=list)
    ambiguous: bool = False
    notes: str = ""


def parse_roster(school_name: str, raw_content: str) -> ParsedRoster:
    client = Anthropic()

    user_message = (
        f"School: {school_name}\n"
        f"Raw scraped roster page content follows (may include HTML table fragments and/or "
        f"plain text):\n\n{raw_content}"
    )

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        tools=[EXTRACT_TOOL],
        tool_choice={"type": "tool", "name": "record_roster"},
        messages=[{"role": "user", "content": user_message}],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "record_roster":
            data = block.input
            return ParsedRoster(
                players=data.get("players", []),
                ambiguous=bool(data.get("ambiguous", False)),
                notes=data.get("notes", ""),
            )

    raise RuntimeError("Claude did not return a record_roster tool call")
