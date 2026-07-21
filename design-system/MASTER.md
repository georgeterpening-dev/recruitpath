# RecruitPath Design System — MASTER

Athletic Command Center: industrial sports energy with digital-premium restraint.
Dark-only. One accent. Data treated as a design element.

## Tokens (single source of truth)

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0A0E1A` | Page background, everywhere. Never `#1c2a3e`. |
| `--card` / surface | `#111827` | Cards, panels, modals |
| surface-2 | `#151D2E` | Elevated hover / nested surfaces |
| `--border` | `#1E293B` | All hairlines. `rgba(255,255,255,0.06)` acceptable on glass |
| `--primary` gold | `#F5B800` | THE accent. CTAs, active nav, key data. Never `#F5C518`. |
| text primary | `#F8FAFC` | Headings, body |
| text secondary | `#94A3B8` | Supporting copy, labels |
| text tertiary | `#64748B` | Metadata only — never body text |
| success | `#22C55E` | Open windows, positive states |
| destructive | `#EF4444` | Errors, destructive actions |

## Typography

- Display: **Barlow Condensed 700/800**, uppercase, `-0.02em`. Page titles, stats, hero.
- UI/body: **Inter** 400/500/600. Never DM Sans, never Bebas Neue.
- Page title scale: `text-4xl md:text-5xl` (utility pages), hero pages may go larger.
- Section label: Inter 600 12px, `0.12em` tracking, uppercase, gold.
- Numbers in stat rows: Barlow Condensed, tabular feel.

## Layout patterns

- **App shell**: fixed 232px sidebar (`#0A0E1A`, 1px border-right `#1E293B`), grouped nav
  (Main: Dashboard/Schools/Outreach/Roster · Account: Profile/Settings/Pricing), active =
  gold 3px left rail + `rgba(245,184,0,0.08)` bg + white label. User identity card pinned bottom.
- **Page header**: left-aligned. Section label on top, condensed title, one-line subtitle,
  actions right. Never a full-viewport centered headline on utility pages.
- **Cards**: `#111827`, border `#1E293B`, radius 12px, shadow `0 4px 24px rgba(0,0,0,0.4)`.
  Hover: border `rgba(245,184,0,0.35)` + translateY(-1px), 200ms ease-out.
- **Primary CTA**: one per screen. Gold fill, dark text, Inter 600.
- Mobile: DockNav bottom pill (signature element). Content reserves `pb-24` above it.

## Motion

- Micro: 150–300ms, ease-out in / ease-in out. Scroll reveals must use
  `viewport={{ once: true, amount: 0.2 }}` and small offsets (y: 16) so content is never
  stuck invisible. Respect `prefers-reduced-motion`.
- Stagger lists 30–50ms per row, max ~8 rows.

## Anti-patterns (do not reintroduce)

- Second gold `#F5C518`, DM Sans, body bg `#1c2a3e`, `[data-slot=sidebar-inset]` overrides
- Full-page interstitials that require a click to reach content (old /profile)
- Duplicate CTAs for the same action in one viewport
- Page-specific `!important` CSS surgery — style at the component instead
- Marketing footer inside authenticated app pages
