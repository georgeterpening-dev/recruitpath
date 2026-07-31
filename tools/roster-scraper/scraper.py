"""Playwright-based roster page finder + raw content extractor.

Given a sport landing page URL, this either confirms the page itself is
already a roster page, or looks for a "Roster" tab/link near the sport's
sub-navigation (schedule/roster/stats) and follows it. It then pulls out
whatever looks like roster content (tables, player cards, or failing that
the page's visible text) for an LLM to parse downstream -- this module does
not attempt to parse individual players itself.
"""

import os
import re
from dataclasses import dataclass
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

NAV_TIMEOUT_MS = 45_000
POST_LOAD_SETTLE_MS = 1500
MAX_RAW_CONTENT_CHARS = 20_000

ROSTER_TEXT_RE = re.compile(r"\broster\b", re.I)
COOKIE_ACCEPT_RE = re.compile(r"accept|agree|got it|ok\b", re.I)

# Header words that show up together on real roster tables/cards.
ROSTER_SIGNAL_WORDS = [
    "no.", "pos", "ht", "wt", "yr", "cl", "hometown", "high school", "jersey",
]


class RosterNotFoundError(Exception):
    """Raised when no roster page/content could be located for a school."""


@dataclass
class RosterScrapeResult:
    roster_url: str
    raw_content: str
    discovery_note: str


def _sport_slug(url: str) -> str | None:
    path = urlparse(url).path.strip("/")
    parts = [p for p in path.split("/") if p]
    if "sports" in parts:
        idx = parts.index("sports")
        if idx + 1 < len(parts):
            return parts[idx + 1].lower()
    if parts:
        return parts[-1].lower()
    return None


def _dismiss_cookie_banners(page) -> None:
    try:
        buttons = page.locator("button, a").all()
    except Exception:
        return
    for btn in buttons[:40]:
        try:
            text = (btn.text_content() or "").strip()
        except Exception:
            continue
        if text and len(text) < 30 and COOKIE_ACCEPT_RE.search(text):
            try:
                btn.click(timeout=1000)
                page.wait_for_timeout(300)
                return
            except Exception:
                continue


def _looks_like_roster(page) -> bool:
    try:
        text = page.inner_text("body").lower()
    except Exception:
        return False
    hits = sum(1 for w in ROSTER_SIGNAL_WORDS if w in text)
    has_table_or_cards = False
    try:
        has_table_or_cards = (
            page.locator("table").count() > 0
            or page.locator("[class*='roster-player'], [class*='person-card'], [class*='sidearm-roster']").count() > 0
        )
    except Exception:
        pass
    return hits >= 3 and has_table_or_cards


def _find_roster_link(page, landing_url: str) -> tuple[str, str] | None:
    try:
        candidates = page.eval_on_selector_all(
            "a[href]",
            "els => els.map(e => ({href: e.href, text: (e.textContent || '').trim()}))",
        )
    except Exception:
        candidates = []

    slug = _sport_slug(landing_url)
    roster_candidates = [
        c for c in candidates
        if c.get("href") and (ROSTER_TEXT_RE.search(c.get("text", "")) or "roster" in c["href"].lower())
    ]
    if not roster_candidates:
        return None

    def score(c):
        s = 0
        href = c["href"].lower()
        if slug and slug in href:
            s += 2
        if "roster" in href:
            s += 1
        if ROSTER_TEXT_RE.search(c.get("text", "")):
            s += 1
        return s

    roster_candidates.sort(key=score, reverse=True)
    best = roster_candidates[0]
    return best["href"], (best.get("text") or "roster link").strip()


def _extract_raw_content(page) -> str:
    parts = []
    try:
        tables = page.locator("table").all()
        for t in tables[:5]:
            try:
                html = t.evaluate("el => el.outerHTML")
                if html and len(html) > 100:
                    parts.append(html)
            except Exception:
                continue
    except Exception:
        pass

    try:
        card_containers = page.locator(
            "[class*='roster-player'], [class*='person-card'], [class*='sidearm-roster']"
        ).all()
        for c in card_containers[:60]:
            try:
                txt = c.evaluate("el => el.innerText")
                if txt and txt.strip():
                    parts.append(txt.strip())
            except Exception:
                continue
    except Exception:
        pass

    combined = "\n\n".join(parts).strip()
    if len(combined) >= 200:
        return combined[:MAX_RAW_CONTENT_CHARS]

    try:
        body_text = page.inner_text("body")
    except Exception:
        body_text = ""
    return body_text[:MAX_RAW_CONTENT_CHARS]


def _try_expand_more(page) -> None:
    for label in ["load more", "show all", "view full roster"]:
        try:
            loc = page.get_by_text(re.compile(label, re.I))
            if loc.count() > 0:
                loc.first.click(timeout=1500)
                page.wait_for_timeout(800)
        except Exception:
            continue


def scrape_school(landing_url: str) -> RosterScrapeResult:
    chromium_path = os.environ.get("PLAYWRIGHT_CHROMIUM_PATH")
    proxy_server = os.environ.get("PLAYWRIGHT_PROXY_SERVER")

    launch_kwargs = {"headless": True}
    if chromium_path:
        launch_kwargs["executable_path"] = chromium_path
    if proxy_server:
        launch_kwargs["proxy"] = {"server": proxy_server}

    with sync_playwright() as p:
        browser = p.chromium.launch(**launch_kwargs)
        try:
            context = browser.new_context(user_agent=USER_AGENT, viewport={"width": 1400, "height": 1000})
            page = context.new_page()
            try:
                page.goto(landing_url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
            except PlaywrightTimeoutError as e:
                raise RosterNotFoundError(f"timed out loading landing page: {e}") from e
            page.wait_for_timeout(POST_LOAD_SETTLE_MS)
            _dismiss_cookie_banners(page)

            if _looks_like_roster(page):
                _try_expand_more(page)
                content = _extract_raw_content(page)
                if not content.strip():
                    raise RosterNotFoundError("landing page looked like a roster but no content could be extracted")
                return RosterScrapeResult(page.url, content, "landing page was already the roster page")

            link = _find_roster_link(page, landing_url)
            if not link:
                raise RosterNotFoundError("no 'roster' link found on landing page navigation")
            href, link_text = link

            try:
                page.goto(href, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
            except PlaywrightTimeoutError as e:
                raise RosterNotFoundError(f"timed out loading roster page ({href}): {e}") from e
            page.wait_for_timeout(POST_LOAD_SETTLE_MS)
            _dismiss_cookie_banners(page)
            _try_expand_more(page)

            content = _extract_raw_content(page)
            if not content.strip():
                raise RosterNotFoundError(f"followed link '{link_text}' to {href} but found no extractable content")

            return RosterScrapeResult(page.url, content, f"navigated via link '{link_text}'")
        finally:
            browser.close()
