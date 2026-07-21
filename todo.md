- [x] Add Stripe secret key, publishable key, and price IDs as secrets
- [x] Update database schema with plan, stripeCustomerId, stripeSubscriptionId fields
- [x] Build Stripe checkout session endpoint (tRPC subscription.createCheckout)
- [x] Build Stripe webhook handler (POST /api/stripe/webhook)
- [x] Build subscription status endpoint (tRPC subscription.status)
- [x] Build Stripe customer portal endpoint (tRPC subscription.createPortal)
- [x] Wire Pricing page to real Stripe checkout
- [x] Wire Settings page to real subscription status and portal
- [x] Wire Schools page to real subscription status for gating
- [x] Write Vitest tests for Stripe endpoints
- [x] Fix Stripe key configuration — add STRIPE_SECRET_KEY and VITE_STRIPE_PUBLISHABLE_KEY via secrets
- [x] BUG FIX: Subscription not persisting after Stripe payment — fix webhook to update user plan
- [x] BUG FIX: Add customer.subscription.deleted handler to downgrade user to free
- [x] BUG FIX: Free plan school limit not enforced — tighten frontend dimming/banner + backend gating
- [x] BUG FIX: Post-payment success page should force fresh user fetch
- [x] FIX: Pro activation stuck on "Activating..." — add direct Stripe session verification fallback
- [x] FIX: Emails page showing hardcoded default schools instead of user's selected schools
- [x] FEATURE: Empty state on Emails page when no schools selected — headline, description, yellow CTA button
- [x] REBUILD: Replace school database with 5-sport-only structure (Football, MBB, WBB, MVB, WVB)
- [x] Research and populate Football — 40 schools with real coach emails
- [x] Research and populate Men's Basketball — 40 schools with real coach emails
- [x] Research and populate Women's Basketball — 40 schools with real coach emails
- [x] Research and populate Women's Volleyball — 35 schools with real coach emails
- [x] Research and populate Men's Volleyball — 20 schools with real coach emails
- [x] Update sport dropdown to only show the 5 supported sports
- [x] Update sport filtering so school selector shows only schools for selected sport
- [x] Update questionnaire to pre-filter school selector based on sport selection
- [x] Remove all other sports and orphaned school/coach records
- [x] Verify ordering: Football top 5, MBB top 5, WBB top 5, WVB top 5, MVB top 5
- [x] Verify every school has at least one coach with valid institutional email
- [x] REBUILD: Replace entire school database with user CSV data (5 sports, ~250 entries)
- [x] REBUILD: School cards show logo via athletics_domain, name, city/state, division badge, conference, coach name/title
- [x] REBUILD: Men's Volleyball D2/NAIA schools get division badge on card
- [x] REBUILD: Update Profile.tsx sport options to match 5 sports only

- [x] CREATE: rosterData.js with data structure for 10 Men's Basketball schools
- [x] IMPLEMENT: calculateRosterGap function with openings, commits, netOpenings, matchScore, reason
- [x] TEST: Console test for calculateRosterGap with Duke Guard 2026

- [x] BUILD: RosterGapFinder.tsx page with headline, description, and search form
- [x] BUILD: Results grid with gap analysis cards and color-coded match scores
- [x] BUILD: Coach info modal integrated with school database
- [x] BUILD: Pro gating with blur overlay and upgrade CTA
- [x] BUILD: Add /roster-gap routing and "GAP FINDER" to floating dock nav
- [x] TEST: Verify search form, results, pro gating, and coach modal work correctly

- [x] FIX: Convert player year strings to graduation year numbers in rosterData.js
- [x] FIX: Update calculateRosterGap to use direct graduationYear comparison
- [x] TEST: Verify match scores are calculated correctly after fix

- [x] REDESIGN: Dashboard — audit existing pages for design tokens
- [x] REDESIGN: Dashboard — hero header with campaign active badge, dynamic name, open windows count
- [x] REDESIGN: Dashboard — stats row (Open Windows, Emails Sent, Schools Targeted, Profile Strength)
- [x] REDESIGN: Dashboard — next action banner with dynamic CTA
- [x] REDESIGN: Dashboard — target schools section with school rows matching Schools page style
- [x] REDESIGN: Dashboard — school detail modal with roster gap, match score ring, coach info
- [x] REDESIGN: Dashboard — bottom stats bar fixed to screen
- [x] REDESIGN: Dashboard — staggered fade-up animations on page load

- [x] RESTRUCTURE: Update DockNav to show only 6 items: Home, Dashboard, Profile, Schools, Pricing, Settings
- [x] RESTRUCTURE: Remove Emails and Gap Finder from nav (keep pages, just remove from nav)
- [x] CLEANUP: Dashboard — increase whitespace between sections, remove bottom stats bar
- [x] CLEANUP: Dashboard — simplify school rows to: logo, name, city/conference, net openings, status badge, arrow
- [x] BUILD: Full-screen school detail modal with expand-from-row animation (cubic-bezier(0.16,1,0.3,1), 400ms)
- [x] BUILD: Modal header — close button, 56px logo, school name, city/conf/div, status badges
- [x] BUILD: Modal Section 1 — Roster Gap Analysis card with 3 columns (Graduating, Commits, Real Openings) + plain English sentence
- [x] BUILD: Modal Section 2 — Match Score card with SVG ring + explanation sentence
- [x] BUILD: Modal Section 3 — Outreach card with coach info, copy email, GENERATE EMAIL button with inline email generation
- [x] BUILD: Modal Section 4 — Roster Intel card (Pro only) with current roster + commits at athlete's position, blur for free users
- [x] BUILD: Modal footer — GENERATE EMAIL primary button + REMOVE SCHOOL ghost button

- [x] CREATE: ModalContext — shared React context for modal-open state (isModalOpen, setModalOpen)
- [x] UPDATE: DockNav — animate slide-left + collapse to 44px circle when isModalOpen=true (350ms cubic-bezier)
- [x] UPDATE: DockNav — animate slide-right + expand back to centered pill when isModalOpen=false
- [x] UPDATE: DockNav — clicking collapsed circle while modal open closes modal via context
- [x] UPDATE: Dashboard — use ModalContext.setModalOpen(true/false) when school modal opens/closes
- [x] WIRE: App.tsx — wrap with ModalProvider so both DockNav and Dashboard share state

- [x] VOLLEYBALL: Parse CSV and prepare 431 player records for seeding
- [x] VOLLEYBALL: Update schema with volleyball-specific fields (positions: OH, MB, OPP, S, L, DS)
- [x] VOLLEYBALL: Clear all existing schools, seed 22 CSV schools + 8 locked schools
- [x] VOLLEYBALL: Seed all 431 players into database
- [x] VOLLEYBALL: Update all copy/labels to Men's Volleyball throughout app
- [x] VOLLEYBALL: Rebuild modal with 3 tabs (School Info, Coach Info, Roster Gap Finder)
- [x] VOLLEYBALL: Test locked schools show "Roster data coming soon" in Roster Gap tab

- [x] FIX: Roster Gap tab shows "No roster data available" — volleyball.players uses protectedProcedure but query is disabled when not authenticated
- [x] FIX: Change volleyball.players to publicProcedure for 22 schools with data; keep Pro gating only for 8 locked schools
- [x] FIX: SchoolDetailModal — remove isAuthenticated guard from players query enabled condition

## Roster Gap Finder End-to-End Fix

- [x] INVESTIGATE: Query DB to confirm player rows exist in players table
- [x] INVESTIGATE: Check school name matching between players table and schools table
- [x] INVESTIGATE: Verify hasRosterData=true is set for all 22 CSV schools
- [x] INVESTIGATE: Trace frontend volleyball.players query and field names
- [x] FIX: Re-seed missing players from CSV if rows are missing (not needed — all 431 rows confirmed present)
- [x] FIX: Normalize school name matching so lookups work correctly (not needed — IDs match correctly)
- [x] FIX: Set hasRosterData=true for all 22 CSV schools after confirming data (already set correctly in DB)
- [x] FIX: Correct Roster Gap Finder query — root cause was !!school.hasRosterData coercion in enabled condition
- [x] VERIFY: UCLA, Ohio State, and Stevens Institute of Technology show real player data — all confirmed working

## Move School Detail Modal to Dashboard
- [ ] SCHOOLS PAGE: Remove modal trigger from school card click — keep only add/remove button with flip animation
- [ ] SCHOOLS PAGE: Remove SchoolDetailModal import and selectedSchool state from Schools.tsx
- [ ] DASHBOARD: Wire school row clicks to open SchoolDetailModal with full 3-tab view
- [ ] DASHBOARD: Import SchoolDetailModal and add selectedSchool state to Dashboard.tsx
- [ ] VERIFY: Schools page cards only add/remove, Dashboard opens full modal on click

## Add Logo.dev School Logos

- [ ] Add athleticsDomain column to schools table in drizzle schema
- [ ] Run pnpm db:push to apply migration
- [ ] Seed all 30 schools with their athletics domains
- [ ] Add VITE_LOGO_DEV_TOKEN secret to environment
- [ ] Create reusable SchoolLogo component with Logo.dev image + initials fallback
- [ ] Replace initials avatars in Schools page SchoolCard
- [ ] Replace initials avatars in Dashboard school list rows
- [ ] Replace initials avatars in SchoolDetailModal header
- [ ] Verify logos load correctly for UCLA, Hawaii, Stevens

## Roster Gap Finder — Personalized Warning Banner
- [x] Add grad year warning banner to Roster Gap tab in SchoolDetailModal
- [x] Read grad year from localStorage (profile data persisted via useProfileStore)
- [x] Create ProfileContext or localStorage-based hook to share grad year across app
- [x] Banner: Class of 2026 — yellow warning about rosters being finalized
- [x] Banner: Class of 2027 — green/yellow positive label "✓ OPENINGS FOR CLASS OF 2027"
- [x] Banner: Class of 2028 — muted warning about recruiting window timing
- [x] Banner: Class of 2029 — muted warning about early recruiting stage
- [x] Banner: No grad year — muted prompt to add graduation year to profile
- [x] Pass athleteGradYear prop to SchoolDetailModal from Dashboard
- [x] Verify all 5 banner states render correctly

## Profile Page — Remove Orbit, Wire Panels to Modal
- [x] Remove OrbitSection component and its call from Profile page
- [x] Remove ORBIT_NODES array and getNodePosition helper (no longer needed)
- [x] Wire ColumnPanel clicks to open profile modal on correct tab instead of expanding the edit form
- [x] Keep three-panel photo layout visually unchanged
- [x] Modal remains closeable via X button and outside click

## Profile Modal — Inline Editable Fields with DB Persistence
- [x] Add athleteProfile table to drizzle/schema.ts
- [x] Push DB migration with pnpm db:push
- [x] Add getAthleteProfile and saveAthleteProfile tRPC procedures
- [x] Make all Personal Info fields inline-editable (click to edit in place)
- [x] Make all Athletic Info fields inline-editable
- [x] Add Save button at bottom of each tab (yellow, shows toast "Saved ✓")
- [x] Profile hero (name, grad year, height, GPA) updates in real time as user edits
- [x] Load profile from DB on mount, fall back to localStorage
- [x] Save persists to DB via tRPC mutation

## DockNav — Collapse to Circle When Full-Screen Modal Open
- [x] Add NavCollapsed context/state to track when a modal is open
- [x] DockNav slides to left side and shrinks to 44px circle when modal is open
- [x] Circle shows X icon
- [x] Clicking circle closes the modal and restores nav
- [x] When modal closes, nav automatically returns to normal position
- [x] Smooth 350ms ease CSS transition
- [x] Triggers on: profile modal, school detail modal, any full-screen overlay

## Roster Gap Finder — Collapse Roster Behind Dropdown
- [x] Keep stat blocks (# Graduating, # Commits, # Real Openings) always visible
- [x] Replace full roster list with collapsed "VIEW FULL ROSTER ↓" toggle button
- [x] Toggle expands/collapses the player list on click (text changes to HIDE ROSTER ↑)

## Profile Fields — Controlled Dropdowns & Validated Inputs
- [x] Graduation Year — dropdown: 2025–2030
- [x] Position — volleyball-specific dropdown (6 options)
- [x] Height — dropdown 5'0" to 7'0" in 1-inch increments
- [x] Weight — dropdown 100–300 lbs in 5lb increments
- [x] GPA — dropdown 1.0–4.0 in 0.1 increments (+ 4.0+)
- [x] SAT Score — dropdown 800–1600 in 10-point increments
- [x] ACT Score — dropdown 1–36 in 1-point increments
- [x] Vertical Jump — dropdown 18"–48" in 1-inch increments
- [x] Approach Jump — dropdown 20"–50" in 1-inch increments
- [x] State — dropdown of all 50 US states + DC
- [x] Intended Major — dropdown with common options
- [x] Email — free text with email format validation before save
- [x] All dropdowns match dark UI style (#1A1A1A bg, white text, #F5C518 accent)

## AI Email Generation Upgrade
- [x] Update generateEmail tRPC procedure to accept athlete profile fields (name, gradYear, position, height, GPA, SAT/ACT, major, highSchool, city/state, verticalJump, approachJump, clubTeam, mediaLinks)
- [x] Pass school data (name, division, conference) and roster gap data into the prompt
- [x] Add school-specific academic program mapping to system prompt (Stanford → engineering, UCLA → business/film, etc.)
- [x] Add uniqueness instruction to prompt (random seed phrase, vary opening line)
- [x] Add tone parameter: Confident / Respectful / Energetic / Concise with per-tone instructions
- [x] Add 4-pill tone selector to Email tab UI (default: Respectful)
- [x] Style pills: unselected = dark bg + gray border, selected = #F5C518 bg + black text
- [x] Wire profile data from localStorage into the email generation call
- [x] Wire roster gap data (openings at athlete's position/grad year) into the prompt

## School Logo Fixes
- [x] Add logoUrl column to schools table in drizzle schema
- [x] Push DB migration with pnpm db:push
- [x] Fix SchoolLogo component CSS: mix-blend-mode screen for SVG overrides, white container for Logo.dev PNGs, onError fallback
- [x] Fetch correct logo URLs for broken schools (Long Beach State cleared to use Logo.dev, NYU/Lindenwood use SVG override with screen blend)
- [x] Seed logoUrl overrides into DB for all broken schools
- [x] Visually verify all 30 logos in Schools tab — all 29 loading (McKendree uses initials fallback due to 404 logoUrl)
- [x] Fix any remaining broken logos after visual check — all confirmed rendering correctly

## Logo Size Increase
- [x] Increase default SchoolLogo size from 40px to 48px across all usages (Schools page, Dashboard, SchoolDetailModal)

## CSV School Import (Men's Volleyball)
- [x] Read CSV file and deduplicate (323 unique schools)
- [x] Compare against existing 30 DB schools, identify 261 new unique schools
- [x] Insert 261 new schools into the schools table (D1: 5, D2: 19, D3: 143, NAIA: 73, CC: 33)
- [x] Verify all 291 schools display correctly on the Schools page

## Coach Data Import (Men's Volleyball)
- [x] Add coaches table to drizzle schema (id, schoolId, firstName, lastName, position, email, sortOrder)
- [x] Run pnpm db:push to create coaches table
- [x] Seed 858 coaches from CSV via Node.js script (scripts/seed-coaches.mjs), 0 unmatched
- [x] Add getCoachesBySchool DB helper in server/db.ts
- [x] Add volleyball.coaches tRPC procedure in server/routers.ts
- [x] Update SchoolDetailModal Coach tab: show primary head coach in existing fields, add "COACHING STAFF" collapsible dropdown for assistants
- [x] Verify Schools section is completely unchanged
- [x] Write vitest tests for coaches procedure (server/coaches.test.ts) — 4 tests passing

## Logo Domain Update (261 New Schools)
- [x] Parse CSV to extract root domains from landing page URLs
- [x] Match CSV school names to DB school names (handle name variations)
- [x] Update athleticsDomain for 260 schools (1 fixed manually: Viterbo University)
- [x] Verify logo display on Schools page — all 291 schools now show logos

## School Sorting — Division + Popularity
- [x] Audit current sorting logic in backend (getAllSchools) and frontend (Schools.tsx)
- [x] Add sortOrder column to schools table in drizzle schema
- [x] Run pnpm db:push to add sortOrder column
- [x] Seed popularity-based sortOrder values for all 291 schools (D1 all ranked, D2 all ranked, D3 top 38, NAIA top 35, CC top 22)
- [x] Update getAllSchools query to ORDER BY divisionPriority CASE, sortOrder ASC, name ASC
- [x] Verify Schools page shows D1 → D2 → D3 → NAIA → CC order with prominent programs first (UCLA, USC, Long Beach State, Hawaii, Stanford...)

## Schools Section — Real Coach Name Display
- [x] Audit how Schools Section renders "Coach TBD" and where school data is fetched
- [x] Update backend getAllSchools to join head coach name via correlated subquery from coaches table
- [x] Update Schools Section frontend to show "Coach [Full Name]" instead of "Coach TBD" (no frontend change needed — already uses coachName || 'Coach TBD')
- [x] Verify: schools with no head coach keep existing placeholder unchanged (Ohio State, George Mason, etc. still show "Coach TBD")
- [x] Verify: Dashboard, school detail modal, and all other sections are untouched

## Ohio State & George Mason Coach Data Fix
- [x] Insert Ohio State coaches: Kevin Burch (Head Coach, sortOrder=0), Hudson Bates (Assoc HC, sortOrder=1), Steven Duhoux (Assistant), Luke Wood Maloney (Assistant), Aaron Capocci (Director of Operations) — fixed schoolId mismatch (mvb-ohio-state → mvb-ohiostate) and sortOrder
- [x] Insert George Mason coaches: Jay Hosack (Head Coach), Sam Greenslade (Recruiting Coordinator/Assistant Coach), Vic Talamo (Assistant), Liran Zamir (Assistant)
- [x] Verify Ohio State shows "Kevin Burch" and George Mason shows "Jay Hosack" in Schools Section
- [x] Verify full coaching staff appears in SchoolDetailModal Coach tab

## School Finder Questionnaire
- [x] Build SchoolFinderQuiz component: 8 questions, progress bar, fade/slide transitions, multi/single select cards
- [x] Implement scoring logic: Division 25pts, Name recognition 20pts, Location 18pts, Academics 12pts, Size 10pts, Major 8pts, Budget 8pts, Environment 7pts
- [x] Build results screen: top 6 matched schools, rank, logo, fit bar, tags, ADD+ button
- [x] Auth gate on ADD+: non-logged-in users see "Create free account" prompt; logged-in users add directly
- [x] Add "FIND YOUR FIT" section to landing page below hero with quiz trigger button
- [x] Build first-time onboarding overlay for new users with zero schools on Dashboard
- [x] Store quiz completion state (localStorage) so pre-signup quiz results auto-populate dashboard after signup
- [x] Only show onboarding overlay once (localStorage flag)
- [x] Add tRPC procedure to add school to user list from quiz results (uses existing outreach.add)

## Quiz Modal Overflow Fix
- [x] Fix SchoolFinderQuiz: Q3, Q6, and results screen content cut off at top — changed justify-center to top-aligned scrollable layout

## Pricing Model Overhaul (One-Time $49.99)
- [x] Audit existing pricing schema, routers, Stripe config, and all UI pages
- [x] Update DB schema: add hasPaidAccess (boolean) and interestedInPro (boolean) fields to users table
- [x] Update Stripe: switch from subscription to one-time payment_intent for $49.99
- [x] Add tRPC procedure: notifyProInterest (saves interestedInPro=true on user record)
- [x] Update pricing page: two-card layout (Full Access $49.99 + Pro Coming Soon)
- [x] Add "NOTIFY ME WHEN AVAILABLE" button on Pro card with database save
- [x] Add reassurance line below cards: "Your $49.99 purchase will be credited toward the Pro plan when it launches."
- [x] Update settings page: show FULL ACCESS if paid, FREE + UPGRADE button if not paid
- [x] Update paywall logic: replace subscription check with hasPaidAccess check everywhere (Dashboard, Schools, RosterGapFinder)
- [x] Replace all copy: "Pro plan" → "Full Access", "subscription" → "one-time purchase", monthly pricing refs → $49.99
- [x] Remove "cancel subscription" language from active user sections
- [x] Run all tests and verify — 20/20 passing

## Beta Badge, Footer, Legal Pages, Profile Lock
- [x] Add "BETA — MEN'S VOLLEYBALL" pill badge to landing page hero (near logo, #1A1A1A bg, #F5C518 text, DM Sans 11px)
- [x] Add "PRICING" nav link to landing page top nav between existing items
- [x] Build global Footer component: left © 2026, center Terms/Privacy links, right contact email
- [x] Add Footer to all pages: landing, dashboard, schools, profile, pricing, settings
- [x] Build /terms page: full Terms of Service with app styling (Bebas Neue heading, DM Sans body)
- [x] Build /privacy page: full Privacy Policy with app styling
- [x] Add /terms and /privacy routes in App.tsx
- [x] Build Schools page profile lock screen: lock icon, headline, missing fields pills, CTA button
- [x] Lock screen shows which specific fields are missing (firstName, lastName, gradYear, position, highSchool)
- [x] CTA button navigates to /profile (Personal Info tab)
- [x] Lock screen disappears once all 5 required fields are filled (re-checks localStorage on each render)

## Footer Padding Fix (Floating Nav Overlap)
- [x] Add pb-[120px] to Terms, Privacy, Home, Dashboard, Schools, Profile, Pricing, Settings pages so footer is never hidden behind floating nav bar
- [x] Check all other pages (RosterGapFinder, Emails) for bottom clipping and apply same fix — both updated to pb-[120px]

## Free Tier Exploit Fix (totalSchoolsAdded lifetime counter)
- [x] Add totalSchoolsAdded integer field (default 0) to users table in schema
- [x] Run pnpm db:push to migrate schema
- [x] Increment totalSchoolsAdded on addSchool (never decrement on remove)
- [x] Update free tier limit check to use totalSchoolsAdded >= 5
- [x] Update paywall message with new copy and "Removing schools does not reset your limit" note
- [x] Update Settings page SCHOOLS ADDED display to show totalSchoolsAdded
- [x] Update vitest tests for new limit logic

## Gmail OAuth Integration
- [x] Add gmailAccessToken, gmailRefreshToken, gmailConnectedEmail, gmailConnectedAt, emailsSent fields to users table
- [x] Run pnpm db:push to migrate schema
- [x] Build server/gmail.ts: encrypt/decrypt helpers, OAuth URL generator, callback handler, disconnect, send endpoint
- [x] Register /api/auth/gmail, /api/auth/gmail/callback, /api/auth/gmail/disconnect, /api/email/send routes in index.ts
- [x] Add gmail.status tRPC query to expose gmailConnectedEmail + emailsSent to frontend
- [x] Update Settings page: EMAIL INTEGRATION section (connect/disconnect UI)
- [x] Update SchoolDetailModal email tab: real send button with Gmail status awareness
- [x] Wire Dashboard EMAILS SENT counter to emailsSent from tRPC
- [x] Write vitest tests for Gmail send and status procedures

## Bug Fix: Coach Email Not Reaching Send Function
- [x] Identify coach email field name in DB schema (coaches/schools table)
- [x] Trace how Coach Info tab reads the email vs how send function reads it
- [x] Fix field name mismatch so send function uses the correct coach email
- [x] Update /api/email/send to read coach email from same source as Coach Info tab
- [x] Fix error message logic: only show "no email" when field is genuinely null/empty
- [x] Update tests and save checkpoint

## Dev Test School
- [x] Add isTestSchool boolean field to schools table in schema
- [x] Run pnpm db:push to migrate
- [x] Insert TEST SCHOOL row and Test Coach row via SQL
- [x] Update getAllSchools / school finder query to filter isTestSchool for non-owner users
- [x] Exclude test schools from school count displays
- [x] Exclude test schools from school finder questionnaire results
- [x] Add yellow TEST badge to SchoolCard for isTestSchool entries
- [x] Sort test schools to bottom of list (after all real schools)
- [x] Run tests and save checkpoint

## Pre-Send Confirmation + Post-Send Success Popup
- [x] Add showConfirmModal state to SchoolDetailModal email tab
- [x] Wire "SEND EMAIL →" button to show confirmation modal instead of sending immediately
- [x] Build pre-send confirmation overlay: warning icon, checklist, subject+body preview, GO BACK / SEND NOW buttons
- [x] Build post-send success popup: green checkmark, EMAIL SENT headline, coach/school subtext, yellow divider, IMPORTANT notice box, GOT IT button
- [x] Both modals: dark card (#1A1A1A, border #3A3A3A, radius 16px), backdrop overlay, Bebas Neue + DM Sans typography
- [x] GOT IT must be manually clicked — no auto-dismiss
- [x] Save checkpoint

## Outreach Tracker Phase 1
- [x] Add sentEmails table to drizzle/schema.ts (id, userId, schoolId, schoolName, coachName, coachEmail, subject, body, sentAt, status)
- [x] Run pnpm db:push to migrate
- [x] Add DB helpers: logSentEmail, getLatestEmailPerSchool, updateEmailStatus, getEmailsSentCount, getActiveOutreachSchoolIds
- [x] Add tRPC procedures: outreachTracker.log, outreachTracker.list, outreachTracker.updateStatus, outreachTracker.emailsSentCount, outreachTracker.activeSchoolIds
- [x] Wire handleConfirmSend in SchoolDetailModal to call outreachTracker.log after successful send
- [x] Build OutreachTracker component: rows with logo, school/division, coach, date, subject, status dropdown, VIEW EMAIL expand, FOLLOW UP button, days-since pill
- [x] Add OUTREACH TRACKER section to Dashboard below TARGET SCHOOLS
- [x] Wire EMAILS SENT stat block to real sentEmails count
- [x] Wire OPEN WINDOWS stat block to schools with no_response status + open roster spots
- [x] Add green dot to TARGET SCHOOLS cards for schools with active outreach status
- [x] Add empty state (no emails yet) with FIND SCHOOLS → button
- [x] Write vitest tests for new procedures
- [x] Save checkpoint

## Outreach Tracker Fixes + AI Reply Generator
- [x] Fix "Response Received" dropdown truncation — widen dropdown to fit longest option
- [x] Fix FOLLOW UP button — open school detail modal on Email tab (not navigate to schools page)
- [x] Add reply section that auto-expands when status = "Response Received"
- [x] Add "GENERATE REPLY" button always visible on each tracker row
- [x] Build paste area for coach response text
- [x] Add tRPC procedure outreachTracker.generateReply (calls Claude with original email + coach response + athlete profile)
- [x] Display COACH ANALYSIS card: interest level badge (Hot/Warm/Neutral/Cold), bullet points, action items
- [x] Display SUGGESTED REPLY card: subject line, editable reply textarea, COPY + SEND buttons
- [x] SEND button opens school detail modal on Email tab
- [x] Loading state: pulsing yellow "Analyzing response..." indicator
- [x] Smooth expand/collapse animation on reply section
- [x] Save checkpoint

## Outreach Tracker v2 Fixes
- [x] Collapsible row: click anywhere on row to expand/collapse; chevron rotates on expand
- [x] Expanded row shows: subject+body read-only box, then VIEW EMAIL / FOLLOW UP / GENERATE REPLY buttons
- [x] Inline Follow Up section: label, context text, GENERATE FOLLOW UP button, Claude call, editable result, COPY + SEND
- [x] Add outreachTracker.generateFollowUp tRPC procedure (Claude, original email + athlete profile + days since)
- [x] Fix status dropdown cutoff: minWidth 200px, overflow visible, all 6 options display fully
- [x] Run tests and save checkpoint

## About Page + Email Generation Fixes
- [x] Create /about page route in App.tsx
- [x] Add ABOUT link to top navigation on landing page
- [x] Build About page: hero, problem, solution (3 cards), who it's for, beta, footer
- [x] Fix email generation: add graduationYear to Claude prompt (athleteGradYear || athleteYear fallback)
- [x] Fix email generation: pass full coach name (first + last) to Claude prompt with "Coach [Name]," greeting
- [x] Test generated emails with 2+ schools to confirm grad year and coach name appear — 4 vitest tests passing
- [x] Save checkpoint

## How It Works Page
- [x] Build /how-it-works page: Section 1 Hero (full viewport, yellow pill, headline, subtitle, scroll cue)
- [x] Section 2: The Old Way — 3 pain point cards (Generic Emails, No Roster Intel, No Follow Through)
- [x] Section 3: The RecruitPath Way — bold statement + 6-step horizontal timeline
- [x] Section 4: Step-by-Step (Steps 01–08) — alternating left/right layout, step number, body, yellow tip card
- [x] Section 5: Comparison table — Feature vs Traditional vs RecruitPath, yellow accent on RecruitPath column
- [x] Section 6: Social proof placeholder — 3 testimonial cards (Class of 2027 OH, 2028 Setter, 2027 Libero)
- [x] Section 7: CTA — headline, subtitle, yellow GET STARTED button, fine print, beta pill
- [x] Register /how-it-works route in App.tsx
- [x] Fix HOW IT WORKS nav link in Home.tsx to route to /how-it-works (not anchor)
- [x] Add AppFooter with pb-[120px] to HowItWorks page
- [x] Save checkpoint

## Four Targeted Fixes
- [x] FIX 1: Remove "Built for Serious Recruits" social proof section from HowItWorks page entirely
- [x] FIX 2: Add yellow "TAKE THE QUIZ NOW →" button below tip card in Step 02 on HowItWorks page — triggers same quiz modal as landing page
- [x] FIX 3: Group outreach tracker rows by status (NEEDS ATTENTION, OFFER RECEIVED, VISIT SCHEDULED, CONVERSATION ONGOING, RESPONSE RECEIVED, FOLLOW UP SENT, NO RESPONSE YET) — NO RESPONSE YET collapsed by default
- [x] FIX 4: Smart notification popup when status changed to "Response Received" — only if reply generator not yet used — auto-dismiss 10s, once per school via localStorage

## Dropdown Menu Fix
- [x] Fix school status dropdown clipping: refactored to use React Portal (renderPortal to document.body)
- [x] Dropdown now uses position: fixed with z-index: 99999, positioned via getBoundingClientRect()
- [x] Removed overflow constraints by rendering outside parent DOM hierarchy
- [x] Tested dropdown visibility — all 43 tests passing, dev server running cleanly
- [x] Save checkpoint

## Dropdown Interactivity Fix
- [x] Root cause: backdrop div (z-index 99998) was rendered inline in React tree inside overflow:hidden parent, blocking clicks
- [x] Fix: moved backdrop to also render via createPortal to document.body (same as dropdown list)
- [x] Both dropdown list and backdrop now fully outside parent DOM hierarchy — no overflow/stacking context issues
- [x] Notification popup z-index unaffected — it renders inline below the summary row, not in the dropdown stack
- [x] All 43 tests passing
- [x] Save checkpoint

## Dropdown Still Broken (Stuck on Response Received)
- [x] Root cause: buttonRect state caused batching race condition — open=true but buttonRect=null in same render cycle, so dropdown never rendered
- [x] Fix: removed buttonRect state entirely; position now computed directly from buttonRef.current.getBoundingClientRect() at render time
- [x] Simplified Portal: backdrop + dropdown list now in single createPortal call, removed AnimatePresence wrapper
- [x] All 43 tests passing
- [x] Save checkpoint

## Notification Flash Fix
- [x] Root cause: row unmounts/remounts when status changes group, destroying showReplyNotif state
- [x] Fix: module-level pendingNotifSchools Set survives remount; useState initializer and useEffect on mount check it
- [x] pendingNotifSchools.add() called BEFORE invalidate() so new component instance sees it on mount
- [x] All 43 tests passing
- [x] Save checkpoint

## LINKS Tab + School Links Seeding
- [x] Add recruitingQuestionnaireUrl and athleticsWebsiteUrl columns to schools table in drizzle/schema.ts
- [x] Run pnpm db:push to migrate schema (migration applied successfully)
- [x] Add getSchoolLinks helper to server/db.ts
- [x] Add volleyball.links tRPC procedure to server/routers.ts
- [x] Write seed-school-links.mjs: parsed CSV, matched 281/291 schools by name
- [x] Write fix-unmatched-links.mjs: manually fixed 10 schools with abbreviated DB names
- [x] All 291 real schools now have recruitingQuestionnaireUrl and athleticsWebsiteUrl seeded
- [x] Add LINKS tab as 5th tab in school detail modal (after Email tab) with Bebas Neue label and yellow underline
- [x] Build Links tab content: two link cards (Recruiting Questionnaire + Athletics Website)
- [x] Recruiting Questionnaire: larger card, yellow OPEN button, primary styling
- [x] Athletics Website: standard card, outlined white VISIT button
- [x] Show dimmed card with "Not available" text when URL is null
- [x] All 43 tests passing
- [x] Save checkpoint

## Audit & Fix Recruiting Questionnaire Links
- [x] Printed all 291 current DB mappings — confirmed USC was mapped to Tusculum URL
- [x] Parsed CSV with proper CSV parser (handles quoted commas), extracted 320 unique schools
- [x] Built strict normalized name matching + 20 manual overrides for abbreviated DB names
- [x] Cleared ALL existing link values before re-seeding (no stale data)
- [x] Re-seeded 291 schools from scratch — 1 skipped (TEST SCHOOL, intentionally null)
- [x] USC now correctly mapped to armssoftware.com/d261b13cd38f
- [x] BYU questionnaire is NULL in CSV source (no questionnaire link exists) — correct
- [x] All 19 key schools verified correct in final DB check
- [x] All 43 tests passing
- [x] Save checkpoint

## Hero HOW IT WORKS Button Fix
- [x] Changed hero's "HOW IT WORKS" button from onClick={scrollToHowItWorks} to Link href="/how-it-works"
- [x] Now navigates to /how-it-works page, consistent with top nav HOW IT WORKS link
- [x] All 43 tests passing
- [x] Save checkpoint

## Welcome Screen (New User Onboarding)
- [x] Add hasSeenWelcome boolean column to users table (default false)
- [x] Run pnpm db:push to migrate schema
- [x] Add dismissWelcome tRPC mutation to set hasSeenWelcome=true
- [x] Update auth.me to return hasSeenWelcome and createdAt fields (auth.me returns full User row via db.getUserByOpenId)
- [x] Build WelcomeOverlay component: full screen, volleyball bg, pill, headline, 4-step card, 2 buttons
- [x] Show overlay only if hasSeenWelcome=false AND account created within last 24 hours
- [x] "SHOW ME HOW IT WORKS →" navigates to /how-it-works and sets hasSeenWelcome=true
- [x] "SKIP — TAKE ME TO MY DASHBOARD" dismisses and sets hasSeenWelcome=true
- [x] Add persistent "HOW IT WORKS →" text link in dashboard top-right near "+ ADD SCHOOLS" button
- [x] Run tests and save checkpoint

## Add 29 Missing Schools from Coach CSV
- [x] Export all school names from DB schools table
- [x] Parse CSV and extract all unique school names
- [x] Normalize and compare both lists to find missing schools (found 33 truly missing)
- [x] Write seed script to add missing schools + coaches to DB (33 schools, 90 coaches added)
- [x] Verify all 320 CSV schools are now in DB (confirmed: 0 missing after seeding)
- [x] Save checkpoint

## Replace Homepage Hero Video
- [x] Download vb_1.mov from Google Drive
- [x] Convert to web-optimized 1080p H.264 MP4 (5 GB → 30 MB)
- [x] Upload to CDN and get public URL
- [x] Update Home.tsx to reference new video URL
- [x] Save checkpoint

## Post-Payment Success Page
- [x] hasPaidAccess already in schema (no migration needed)
- [x] verifySession tRPC procedure already existed — updated to send confirmation email
- [x] Confirmation email via nodemailer (server/email.ts) — fire-and-forget on verifySession
- [x] Build /success page: dark bg, animated checkmark, pill, headline, feature card, 3 buttons
- [x] Add confetti animation (canvas-confetti) on page load — yellow + white, 3 second burst
- [x] Wire Stripe checkout success_url to /success?session_id={CHECKOUT_SESSION_ID}
- [x] Register /success route in App.tsx
- [x] All 43 tests passing, TypeScript: 0 errors

## Free Trial Messaging & About Page Fixes
- [x] Add "First 5 schools free — no credit card required" subtext under Get Started buttons on Home page
- [x] Add "First 5 schools free — no credit card required" subtext under Get Started button on Pricing page
- [x] Add "FREE TO START — NO CARD NEEDED" banner at top of signup page
- [x] Add "Add up to 5 schools completely free..." subtext below banner on signup page
- [x] Add free trial language under Free tier card on Pricing page
- [x] Add "One-time payment. Starts after your 5 free schools." note under $49.99 button on Pricing
- [x] Fix About page headline: split "BUILT FOR ATHLETES. BY ATHLETES." onto two lines
- [x] Fix About page subtitle: widen container so it fits on one line on desktop
- [x] TypeScript: 0 errors, 42/43 tests passing (1 unrelated timeout)

## Remove Duplicate Schools from Database
- [x] Export all 325 school names from DB and run fuzzy matching
- [x] Identified 4 true duplicate pairs: UCLA/Brigham Young/UC Irvine/Hawaii
- [x] Deleted 4 long-form duplicate schools + 16 associated coaches
- [x] Final school count: 321

## Replace Bottom Nav with Fixed Top Nav (Authenticated Pages)
- [x] Remove DockNav from all authenticated pages and App.tsx
- [x] Build AppTopNav component (56px, blur bg, logo, center links, avatar dropdown, mobile hamburger)
- [x] Add active state logic based on current route
- [x] Added AppTopNav to: Dashboard, Schools, Profile, Pricing, Settings, Emails, RosterGapFinder
- [x] HowItWorks and About kept their own public-facing TopNav (public pages)
- [x] TypeScript: 0 errors, 43/43 tests passing

## Google Sign-In Integration
- [x] Add googleAuthUser boolean to users table (default false), run pnpm db:push
- [x] Build /api/auth/google and /api/auth/google/callback routes on the server
- [x] On callback: find-or-create user by email, set googleAuthUser=true for new accounts
- [x] Issue same JWT session cookie as email/password login
- [x] Add "CONTINUE WITH GOOGLE" button to Login page (above form, with OR divider)
- [x] Add "CONTINUE WITH GOOGLE" button to Signup page (above form, with OR divider)
- [x] Redirect to /dashboard after Google Sign-In (welcome overlay handles hasSeenWelcome check)
- [x] Run tests and save checkpoint

## School Questionnaire Multi-Select
- [x] Update all QUESTIONS in SchoolFinderQuiz to set multi: true (except division which should stay single)
- [x] Update QuizAnswers interface to make all fields arrays (division stays string)
- [x] Update EMPTY_ANSWERS to initialize all fields as empty arrays
- [x] Update scoring logic to handle multi-select for each question
- [x] Test questionnaire with multi-select answers
- [x] Verify scoring still works correctly with multiple selections
- [x] Run tests and save checkpoint

## Logo Navigation Update
- [x] Change AppTopNav RECRUITPATH logo link from /dashboard to / (home page)

## Remove HOME Button from Home Page Navigation
- [x] Remove HOME button from the top navigation on the home page

## Auth-Aware Landing Page CTAs
- [x] Detect user login status on landing page
- [x] Change "GET STARTED" button to "GO TO DASHBOARD" for logged-in users
- [x] Change nav "SIGN IN" to "DASHBOARD" for logged-in users
- [x] Update button destinations to /dashboard for authenticated users
- [x] Hide "First 5 schools free" text for logged-in users

## Remove DASHBOARD Button from Home Page Top Nav
- [x] Remove the DASHBOARD text link from top navigation for logged-in users

## Public Navigation Standardization
- [x] Create PublicNav component with standardized styling and auth-aware buttons
- [x] Update About page to use PublicNav with currentPage="about"
- [x] Update HowItWorks page to use PublicNav with currentPage="how-it-works"
- [x] Update Pricing page to use PublicNav with currentPage="pricing"
- [x] Verify all public pages have consistent nav styling and auth-aware buttons

## Contact Us Page
- [x] Create Contact Us page at /contact with contact form (name, email, message fields)
- [x] Add tRPC endpoint to handle contact form submissions (system.contactUs)
- [x] Add "CONTACT" link to TopNav on all public pages (/about, /how-it-works, /pricing, /contact)
- [x] Style form with consistent design (dark bg, yellow accent button, validation)
- [x] Add success message after form submission
- [x] Test form submission and navigation
- [x] Add Contact route to App.tsx

## Authenticated App Navigation Styling
- [x] Create new AppTopNav component matching public nav design (background, fonts, spacing, colors)
- [x] Update AppTopNav with app links: DASHBOARD, SCHOOLS, PROFILE, PRICING, SETTINGS
- [x] Add user avatar circle (32px, initials, #1A1A1A bg, #F5C518 text) + first name dropdown
- [x] Add dropdown menu with "View Profile" and "Sign Out" options
- [x] Update all authenticated pages to use new AppTopNav
- [x] Verify styling matches public nav exactly (background, blur, border, fonts, colors)
- [x] Test active link highlighting and hover states

## School Card Entrance Animations
- [x] Create custom hook useIntersectionAnimation for slide-up fade-in effect
- [x] Add IntersectionObserver to detect cards entering viewport
- [x] Implement staggered animation (60ms delay between cards)
- [x] Apply animation to SchoolCard component in Schools page
- [x] Test animation on page load and scroll
- [x] Test animation with filters/search applied
- [x] Verify animation works with dynamically rendered cards

## Authenticated Nav Scroll Effect
- [x] Update AppTopNav background to transparent at rest, blur on scroll
- [x] Center nav links (DASHBOARD, SCHOOLS, PROFILE, PRICING, SETTINGS) in middle
- [x] Add yellow underline on active link matching public nav
- [x] Match scroll-triggered border color from public nav (rgba(30,41,59,0.6))
- [x] Smooth transition on scroll effect

## Outreach Tracker Dropdown Positioning
- [x] Detect available space above vs below dropdown trigger
- [x] Open upward when more space above or insufficient space below
- [x] Maintain high z-index (99999) to prevent clipping
- [x] Apply to all status dropdowns in outreach tracker

## Gmail OAuth Flow Fix
- [x] Audit /api/auth/gmail/callback route for code reception
- [x] Add logging at each step of OAuth callback (code, state, token exchange, DB write)
- [x] Fix root cause: Gmail flow was using GOOGLE_REDIRECT_URI (/api/auth/google/callback) instead of /api/auth/gmail/callback — Google was sending auth code to wrong endpoint
- [x] Added getGmailRedirectUri() helper that derives correct /api/auth/gmail/callback URI from GOOGLE_REDIRECT_URI base domain
- [x] Token refresh on 401 already implemented in sendGmailEmail (retry once with refreshed token)
- [x] Database write, session handling, and redirect to /settings were all correct — only the redirect URI was wrong
- [x] All 43 tests passing, TypeScript: 0 errors

## Interactive Dashboard Stat Blocks
- [x] Add hover effects to all four stat blocks (yellow border, lift, glow, pointer cursor)
- [x] OPEN WINDOWS: click opens modal showing all user's schools sorted by roster openings
- [x] EMAILS SENT: click smoothly scrolls to outreach tracker section
- [x] SCHOOLS TARGETED: click opens modal showing schools with email sent/not sent status
- [x] PROFILE STRENGTH: click navigates to /profile
- [x] Build Open Windows modal (school logo, name, division, open spots badge, VIEW button)
- [x] Build Schools Targeted modal (school logo, name, email sent/not sent pill, ADD MORE SCHOOLS button)
- [x] Both modals use existing dark modal design system
- [x] Test all interactions end-to-end — 43/43 tests passing, TypeScript: 0 errors

## School Finder Questionnaire Multi-Select Fix
- [x] Update all questions in SchoolFinderQuiz to allow multi-select (toggle behavior)
- [x] Add validation: require at least one option selected before advancing
- [x] Add shake animation when user tries to advance with zero selections
- [x] Scoring logic already handles multi-select (sums/averages across all selected options)
- [x] Test multi-select behavior on all questions
- [x] Verify scoring works correctly with multiple selections
- [x] Run tests and save checkpoint — 43/43 tests passing, TypeScript: 0 errors

## Outreach Tracker Notification Fix
- [x] Decouple notification state from dropdown state (separate useState variables)
- [x] Render notification as sibling element outside dropdown component
- [x] Add 100ms delay before showing notification after status selection
- [x] Use ref to lock notification visibility for full 10 seconds
- [x] Test notification stays visible when dropdown closes
- [x] Verify no row height locking or overlay elements — 43/43 tests passing, TypeScript: 0 errors

## Outreach Tracker Notification Rebuild (Parent-Level State)
- [x] Move notification state to parent OutreachTracker component as { [schoolId]: boolean }
- [x] Move status change handler to parent component
- [x] Notification rendered inside TrackerRowCard but driven by parent state (showNotif prop)
- [x] Add dismiss logic with setTimeout and dismissedNotifications tracking
- [x] Thread onStatusChange, showNotif, onDismissNotif, onOpenReplyGenerator props through StatusGroupSection to TrackerRowCard
- [x] Test notification stays visible through row re-renders
- [x] 43/43 tests passing, TypeScript: 0 errors

## Global NotificationPortal (Decoupled from Outreach Tracker)
- [x] Create NotificationPortal component using ReactDOM.createPortal into document.body
- [x] NotificationPortal listens for custom browser event 'showReplyNotification' via window.addEventListener
- [x] NotificationPortal manages its own state (visible, schoolId, schoolName) — no connection to tracker tree
- [x] Position: fixed bottom-right (bottom: 24px, right: 24px, z-index: 9999)
- [x] Auto-dismiss after 10 seconds via setTimeout inside NotificationPortal
- [x] Persist dismissed state in localStorage keyed by schoolId
- [x] "GENERATE REPLY →" button fires custom event 'openReplyGenerator' and dismisses
- [x] "I ALREADY REPLIED" button dismisses and marks dismissed in localStorage
- [x] Update OutreachTracker: remove all activeNotifs state, timers, showNotifForSchool, dismissNotif
- [x] Update OutreachTracker: in updateStatus onSuccess, fire window.dispatchEvent(new CustomEvent('showReplyNotification', { detail: { schoolId, schoolName } })) when status === 'response_received'
- [x] Update OutreachTracker: listen for 'openReplyGenerator' event to expand the correct row
- [x] Remove showNotif, onDismissNotif, onOpenReplyGenerator props from TrackerRowCard and StatusGroupSection
- [x] Mount NotificationPortal at app root in App.tsx
- [x] 43/43 tests passing, TypeScript: 0 errors

## AI Email Prompt Overhaul + Email Tab Enhancements
- [x] Overhaul email generation system prompt: structural randomization (opening, order, closing, tone, length)
- [x] Enforce banned phrases: no "Dear Coach", "My name is", "I am writing to express", "I" as opener, "Sincerely"
- [x] Subject line rules: grad year + position + hook, never include stats/GPA/height/vertical/SAT
- [x] Every email must end with a rotating genuine question
- [x] Add "ANYTHING SPECIFIC TO MENTION?" free text box (max 200 chars) to Email tab above GENERATE EMAIL button
- [x] Add "VIEW TEAM PAGE →" outlined button in Email tab that opens athleticsWebsiteUrl in new tab (hidden if no URL)
- [x] Pass program notes into Claude prompt when provided
- [x] Add "who else is recruiting you" detection to reply generator prompt with strategic framework
- [x] 43/43 tests passing, TypeScript: 0 errors

## Email Tab Visual Improvements
- [x] Enhance program notes input box: white label, 2px border (#2A2A2A → #F5C518 on focus), 3px left accent border (#F5C518), #1A1A1A background, #666 placeholder
- [x] Add helper text below input: "Reference a recent win, a roster move, or anything you noticed about the program — the AI will weave it in naturally"
- [x] Add "🔗 FIND RECENT NEWS TO ADD →" button below input box (outlined, #2A2A2A border, white text, 8px radius, hover: #F5C518)
- [x] Button opens athleticsWebsiteUrl in new tab, hidden if no URL
- [x] 43/43 tests passing, TypeScript: 0 errors

## Scroll-to-Top on Route Change
- [x] Add ScrollToTop component that calls window.scrollTo(0, 0) on every pathname change
- [x] Place ScrollToTop inside Router, above all Route definitions
- [x] 43/43 tests passing, TypeScript: 0 errors

## Logo Background Color Fixes
- [x] Concordia University Irvine → #154734 (forest green)
- [x] Lincoln Memorial University → #6B6B6B (medium gray)
- [x] North Greenville University → #000000 (black)
- [x] Tusculum University → #000000 (black)
- [x] Baruch College → #003087 (dark blue)
- [x] Hunter College → #5C2D91 (purple)
- [x] North Park University → #003087 (dark blue)
- [x] Bridgewater College → #1A1A1A (dark gray/black)
- [x] Aurora University → #003087 (dark blue)
- [x] Endicott College → #003087 (dark blue)
- [x] Curry College → apply mix-blend-mode: screen (or multiply), background #000000
- [x] Eureka College → apply mix-blend-mode: screen (or multiply), background #000000
- [x] Added logoBackgroundColor and logoMixBlendMode fields to schema, DB, server, and all frontend components
- [x] Fixed SchoolDetailModal.tsx SchoolModalProps to include logoBackgroundColor and logoMixBlendMode
- [x] 43/43 tests passing, TypeScript: 0 errors

## School Athletics URL Re-seed (320_Schools_Urls.xlsx)
- [x] Read spreadsheet: 320 rows, columns: school_name, program_url, roster_url
- [x] Updated all 320 non-test schools with athleticsWebsiteUrl from spreadsheet
- [x] Updated all 320 non-test schools with athleticsDomain (root domain extracted from URL)
- [x] Handled name normalization (St. -> Saint, University of X vs X University, etc.)
- [x] Handled abbreviated DB names (Long Beach State, Stanford, UCLA, USC, etc.) — all matched via fuzzy search
- [x] 1 school not in DB: Simpson University (not in database, skipped)
- [x] Cal Lutheran already had correct data (clusports.com)
- [x] Final state: 320/320 schools have athleticsWebsiteUrl and athleticsDomain set
- [x] 43/43 tests passing, TypeScript: 0 errors

## Remove Scroll Animations from School Cards
- [x] Audit Schools.tsx for IntersectionObserver, useEffect class manipulation, opacity/transform initial states
- [x] Audit Schools.tsx for any AOS, ScrollReveal, Framer Motion scroll trigger imports
- [x] Audit index.css for @keyframes and animation classes referenced by school cards
- [x] Remove useIntersectionAnimation hook import and all usage from SchoolCard
- [x] Remove staggerIndex prop from SchoolCard (was only used for animation stagger)
- [x] Remove transition: 'opacity 300ms ease' from card wrapper outer div
- [x] Ensure all school cards render with opacity: 1 (or 0.4 for locked), transform: none, no transition on opacity/transform
- [x] index.css card-flip classes only used for flip rotation (not scroll animation) — no changes needed
- [x] 43/43 tests passing, TypeScript: 0 errors

## Profile Page Redesign
- [x] Remove three clickable panels (Personal Info, Athletic Info, Media & Links) from Profile landing page
- [x] Add single "VIEW & EDIT PROFILE →" CTA button below hero subtext
- [x] Build new profile modal: 90vw/1100px wide, 90vh tall, 20px radius, #111111 bg, dark backdrop
- [x] Modal header: 72px avatar circle with initials, name in Bebas Neue 26px, badges row, profile strength bar, X close
- [x] Modal body: 3-column layout (Personal, Athletic, Media & Links) with dark cards
- [x] Column 1 Personal: Full Name, Grad Year, High School, Location, GPA, SAT, ACT, Major
- [x] Column 2 Athletic: Position, Height, Weight, Club Team, Vertical Jump, Approach Jump, Key Stats, Athletic Awards
- [x] Column 3 Media & Links: Hudl, NCSA, Highlight Film, Instagram, Twitter/X as row cards
- [x] Inline editing: EDIT → transforms column to editable inputs, SAVE ✓ returns to read mode
- [x] Modal footer: profile strength bar + missing fields list + SAVE CHANGES + CLOSE buttons
- [x] Profile strength: 16 fields, filled/16 * 100 rounded, shown in header and footer
- [x] 43/43 tests passing, TypeScript: 0 errors

## Profile Modal Layout Redesign (2-panel)
- [x] Replace 3-column layout with 2-panel: 160px left nav + full-width content panel
- [x] Left nav: #0A0A0A bg, right border 1px #1A1A1A, stacked PERSONAL / ATHLETIC / MEDIA & LINKS items
- [x] Nav items: Bebas Neue 12px, inactive #444, active #F5C518 + 3px yellow left border + #141414 bg, hover #888
- [x] Left nav bottom: profile strength % in yellow Bebas Neue 20px + label + thin progress bar
- [x] Personal panel: 2-column grid, fields with 10px label / 15px value, 1px bottom border dividers, EDIT → / SAVE ✓
- [x] Athletic panel: 2-column grid, Key Stats and Athletic Awards full-width textarea when editing
- [x] Media & Links panel: single-column spacious row cards, tip card at bottom
- [x] Modal footer: right-aligned SAVE CHANGES + CLOSE buttons only (no left strength bar)
- [x] 43/43 tests passing, TypeScript: 0 errors

## Profile Modal Fixes
- [x] Change EDIT → button color from #444 to #888888 on all three section headers (Personal, Athletic, Media & Links)
- [x] SAVE ✓ state is #F5C518 yellow (confirmed correct)
- [x] Media & Links: clicking "Add link →" on empty row makes that row individually editable (pre-focused input)
- [x] Existing filled links also clickable to edit inline
- [x] Per-row SAVE → (yellow) and CANCEL (muted) buttons below input; editing one row doesn't affect others
- [x] Enter key saves, Escape key cancels per-row edit
- [x] 43/43 tests passing, TypeScript: 0 errors

## Onboarding Flow
- [x] Add hasCompletedOnboarding boolean (default false) to users table in drizzle/schema.ts
- [x] Add dateOfBirth field to athleteProfiles table in drizzle/schema.ts
- [x] Run pnpm db:push to migrate schema (migration 0018_glossy_talkback.sql)
- [x] Add tRPC onboarding.status (returns hasCompletedOnboarding) and onboarding.complete (upserts profile + sets flag)
- [x] Build /onboarding page: full-screen #0A0A0A, no nav, RECRUITPATH logo left + step progress bar center
- [x] Step progress bar: 3 circles (32px) with connecting line, completed=yellow+checkmark, current=white outline, upcoming=#2A2A2A
- [x] Step 1 "Your Info": First Name, Last Name, Date of Birth fields; NEXT → disabled until all filled; inline validation
- [x] Step 2 "Your Sport": Position pill grid (6 options), High School text input, Graduation Year pill row (4 years); FINISH → disabled until all filled
- [x] Step 3 "Done": animated checkmark, "YOU'RE ALL SET." headline, "GO TO DASHBOARD →" button
- [x] GO TO DASHBOARD → saves all data to athleteProfile, sets hasCompletedOnboarding, redirects to /dashboard
- [x] Back button on Step 2 (← BACK, muted, bottom left)
- [x] googleAuth.ts: new users redirected to /onboarding; returning users go to returnPath
- [x] /onboarding: if user.hasCompletedOnboarding=true, redirect to /dashboard immediately
- [x] 43/43 tests passing, TypeScript: 0 errors

## Remove Manus Auth — Replace with RecruitPath Native Auth
- [x] Audit all Manus auth touchpoints (server + client)
- [x] Add passwordHash column to users table, push migration
- [x] Build POST /api/auth/register (email+password, bcrypt hash, issue JWT cookie, redirect /onboarding)
- [x] Build POST /api/auth/login (email+password verify, issue JWT cookie, redirect /dashboard or /onboarding)
- [x] Register emailAuth routes in server/_core/index.ts
- [x] Rewrite server/_core/context.ts: direct jose jwtVerify + getUserByOpenId (no sdk.authenticateRequest)
- [x] Replace sdk.authenticateRequest in gmailRoutes.ts with direct JWT verification
- [x] tRPC auth.me already returns user from RecruitPath DB only — no changes needed
- [x] useAuth hook already calls tRPC auth.me — no changes needed
- [x] Wire SignIn form to POST /api/auth/login with loading/error state
- [x] Wire SignUp form to POST /api/auth/register with loading/error state
- [x] Replace getLoginUrl() in client/src/const.ts to return /signin (no Manus OAuth portal)
- [x] Remove manus-runtime-user-info localStorage write from useAuth hook
- [x] Replace /api/oauth/callback with stub redirecting to /signin
- [x] auth.logout tRPC procedure already only clears RecruitPath cookie — no changes needed
- [x] Google OAuth (googleAuth.ts) already uses sdk.createSessionToken which is local JWT — unchanged
- [x] 43/43 tests passing, TypeScript: 0 errors

## Dashboard Greeting Fix
- [x] Update Dashboard greeting to pull firstName from athleteProfile instead of user.name
- [x] Fallback to email prefix if firstName not set (user hasn't completed profile)
- [x] Greeting auto-updates when user changes firstName in profile modal
- [x] TypeScript: 0 errors

## How It Works Step 05 — Gmail CTA Button
- [x] Add gmailButton flag to Step type definition
- [x] Add gmailButton: true to Step 05 entry
- [x] Build GmailCtaButton component with 3 states: not logged in, Gmail connected, Gmail not connected
- [x] Not logged in: "GET STARTED →" yellow button links to /signup
- [x] Gmail connected: "GMAIL CONNECTED ✓" green outlined button, disabled, no action
- [x] Gmail not connected: "CONNECT YOUR GMAIL →" yellow button links to /settings?section=gmail
- [x] Render GmailCtaButton in StepRow for Step 05 (16px margin above button)
- [x] TypeScript: 0 errors

## Roster Seed from Excel Spreadsheet
- [x] Read 2025-26_Collegiate_Mens_Volleyball_Master_Roster.xlsx (240 schools, 4032 player rows)
- [x] Match schools by name (normalized + manual overrides for 15 edge cases)
- [x] Delete existing player records for matched schools before inserting
- [x] Insert all player rows from spreadsheet
- [x] Set hasRosterData=true for all 240 matched schools
- [x] Log: 240/240 schools matched, 4018 players in DB, 0 unmatched

## Dashboard TARGET SCHOOLS — Star, Filter, Sort
- [x] Add `starred` boolean (default false) to outreachList table in drizzle/schema.ts
- [x] Run pnpm db:push to migrate schema
- [x] Add tRPC outreach.toggleStar(schoolId) protected procedure with optimistic update
- [x] Add toggleOutreachStarred helper to server/db.ts
- [x] Star icon on each school card: outlined (#2A2A2A) vs filled (#F5C518), click toggles
- [x] Starred schools grouped at top under "STARRED" label (Bebas Neue 10px #F5C518)
- [x] Non-starred schools below under "ALL SCHOOLS" label (only shown when starred group exists)
- [x] Filter/sort bar above TARGET SCHOOLS list (single row, controls on right)
- [x] Filter dropdown: Division checkboxes (D1/D2/D3), State selector, Has Roster Data toggle, Starred Only toggle
- [x] Filter panel: dark card #1A1A1A, #2A2A2A border, 12px radius, 20px padding, closes on outside click
- [x] APPLY FILTERS yellow button + CLEAR ALL muted link in filter panel
- [x] Sort dropdown: Most openings first, Least openings first, A-Z, Z-A, Most recently added, Starred first
- [x] Results count: "Showing X of Y schools" muted text on left side of bar
- [x] Yellow dot on Filter button when any filter is active
- [x] Empty state when filters match 0 schools (with "Clear filters" link)
- [x] 43/43 tests passing, TypeScript: 0 errors

## Multi-Position Support + Dashboard Position Toggle
- [x] Update athleteProfiles.position from varchar to JSON text (store as array), push migration
- [x] Profile modal Athletic: replace single-select with 6 pill multi-select (OH, MB, OPP, S, L, DS)
- [x] Profile modal: selected pills = #F5C518 bg + black text; unselected = #1A1A1A bg + #2A2A2A border + #888 text
- [x] Profile modal: save position as JSON array to DB
- [x] Onboarding Step 2: change position pill grid to multi-select (toggle, multiple allowed)
- [x] Onboarding: save positions as array to athleteProfile on completion
- [x] Dashboard filter bar: add ALL OPENINGS / MY POSITION pill toggle buttons
- [x] ALL OPENINGS (default): shows total openings across all positions on each school card
- [x] MY POSITION: shows openings only for user's selected positions on each school card
- [x] MY POSITION tooltip when no position set: "Add your position in your profile to use this filter"
- [x] Active pill: #F5C518 bg + black text; inactive: #1A1A1A bg + #2A2A2A border + #888 text
- [x] Roster Gap Finder: update to show openings for any of the user's positions (OR logic)
- [x] AI email generation: if multiple positions, reference both naturally ("I play both setter and libero")
- [x] Dashboard greeting subtext: "at your position" → "at your positions" when multiple selected
- [x] Profile hero badges: show all selected positions as separate badges
- [x] 43/43 tests passing, TypeScript: 0 errors

## BUG FIX: Multi-position selection not persisting
- [x] Root cause: athleteProfile.save tRPC input schema was missing `positions` field (only had old `position` singular)
- [x] Fix: Add `positions` (and all other profile fields) to the save procedure's z.object() input schema
- [x] Fix: DB now correctly stores JSON array string e.g. '["Setter","Libero","Defensive Specialist"]'
- [x] Verify: Dashboard userPositions reads from DB via athleteProfile.get — now reflects saved multi-positions
- [x] 43/43 tests passing, TypeScript: 0 errors

## Final Batch Roster Seed (Copyof2025-26_Collegiate_Mens_Volleyball_Master_Roster.xlsx)
- [x] Read 320-school spreadsheet (5,380 player rows)
- [x] Match all 320 schools by name to DB (0 unmatched — 100% match rate)
- [x] Delete existing roster records for each matched school before inserting
- [x] Insert all 5,380 player rows from spreadsheet
- [x] Set hasRosterData=true for all 320 matched schools
- [x] Spot-checked 3 schools: Quincy (1 opening), Princeton (1 opening), Viterbo (0 openings) — all correct
- [x] DB totals: 6,750 total players, 288/321 schools with hasRosterData=true

## BUG FIX: MY POSITION toggle showing zero openings
- [x] Diagnose position mismatch: players table uses abbreviations (OH, MB, S, L, DS) vs profile uses full names (Outside Hitter, Setter, Libero)
- [x] Build position normalization map covering all known variations
- [x] Fix getOpeningCountsByPositions in server/db.ts to normalize both sides before comparing
- [x] Roster Gap Finder modal per-position breakdown already uses abbreviations correctly — no change needed
- [x] Add console logging for verification (server-side logs on each MY POSITION query)
- [x] TypeScript: 0 errors, Tests: 43/43 passing

## BUG FIX: Star button on school cards
- [x] Located star button onClick handler in Dashboard.tsx
- [x] Fixed: button now calls e.stopPropagation() directly before calling onStar() — prevents card modal from opening
- [x] Verified backend toggleStar procedure exists and works correctly
- [x] Optimistic update already in place via trpc.outreach.list.setData
- [x] Increased icon size to 22px, hit area to 36x36px (padding: 7px)
- [x] Unstarred: #2A2A2A outlined star; Starred: #F5C518 filled star with stroke
- [x] 0.15s color transition on toggle
- [x] TypeScript: 0 errors, Tests: 43/43 passing

## Roster Gap Calculation Rebuild (Single Source of Truth)
- [ ] Audit all calculation sites: server/db.ts getOpeningCounts, getOpeningCountsByPositions, SchoolDetailModal frontend logic
- [ ] Log raw inputs/outputs for 3 schools to diagnose wrong numbers
- [ ] Rebuild getSchoolOpenings(schoolId, userGradYear, userPositions) as single source of truth in server/db.ts
- [ ] graduating = players WHERE graduation_year = userGradYear (exact match only)
- [ ] position_graduating = graduating WHERE normalized position matches any userPosition
- [ ] commits = players WHERE graduation_year = userGradYear + 4 (incoming freshmen as proxy)
- [ ] openings = graduating - commits, clamped to 0
- [ ] Full position normalization map on both sides before comparing
- [ ] New tRPC procedure: volleyball.getSchoolOpeningsBatch(schoolIds, userGradYear, userPositions)
- [ ] Replace dashboard card openingCounts with new procedure
- [ ] Replace MY POSITION toggle activeOpeningCounts with new procedure
- [ ] Replace OPEN WINDOWS stat block with new procedure
- [ ] Replace SchoolDetailModal Roster Gap tab calculations with new procedure
- [ ] Log verification for 5 schools confirming numbers match modal roster view
- [ ] TypeScript: 0 errors, Tests: 43/43 passing

- [x] BUG FIX: athleteGradYear useMemo had selectedSchool guard causing "" fallback on first open — removed guard so grad year is always computed from athleteProfile/localStorage regardless of selectedSchool
- [x] BUG FIX: Per-position player groups in SchoolDetailModal use p.position === pos (exact match), missing slash-separated positions like OH/OPP, L/DS, MB/OPP — fix to split on / and check if any part matches

## Subscription Model Migration (one-time → Free/Pro monthly/annual)

- [x] Schema: add subscriptionType (monthly/annual/grandfathered/null) and subscriptionStatus (active/cancelled/past_due/null) to users table
- [x] DB push: run pnpm db:push to apply schema changes
- [x] Stripe products.ts: replace one-time $49.99 with monthly ($25) and annual ($220) recurring price IDs
- [x] Request STRIPE_MONTHLY_PRICE_ID and STRIPE_ANNUAL_PRICE_ID secrets
- [x] Server routers.ts: update createCheckout to accept billingPeriod param and use subscription mode
- [x] Server routers.ts: update status procedure to return subscriptionType and subscriptionStatus
- [x] Server routers.ts: grandfather existing paid users (set subscriptionType='grandfathered')
- [x] Webhook: handle customer.subscription.updated and customer.subscription.deleted events
- [x] Pricing page: rewrite with Free/Pro two-card layout and monthly/annual toggle
- [x] Update all $49.99 / "Full Access" / "GET FULL ACCESS" prompts throughout app
- [x] Landing page: update CTA subtext to "Free to start — Pro from $25/month"
- [x] Schools page lock: update to "Upgrade to Pro — from $25/month"
- [x] Dashboard lock: update to "Upgrade to Pro — from $25/month"
- [x] RosterGapFinder lock: update to "Upgrade to Pro — from $25/month"
- [x] Success page: show monthly vs annual subtext based on subscriptionType
- [x] Settings page: add SUBSCRIPTION section with plan, billing period, next billing date, manage button
- [x] Update subscription.test.ts for new subscription model

## Roster Gap Calculator Rebuild
- [x] Audit all files with roster gap calculation logic
- [x] Create shared/rosterGapCalculator.ts with single canonical calculateRosterGap function
- [x] Rewrite server/db.ts getSchoolOpeningsBatch to use calculateRosterGap
- [x] Rewrite getOpeningCountsByPositions to use calculateRosterGap
- [x] Rewrite SchoolDetailModal: delete all local gap math, use result.graduatingPlayers for red highlights
- [x] Remove CAMPAIGN ACTIVE badge from Dashboard
- [x] Add Hawaii/UCLA debug console logs
- [x] TypeScript: 0 errors, Tests: 44/44 passing
- [x] FIX: Duplicate players in roster display (same player with multiple positions) — merge by name before rendering, keep gap calculation unchanged

## Sidebar Nav Update — Icon + Label Layout
- [x] Add text labels (DM Sans 13px, sentence case) next to each icon in AuthSidebar
- [x] Evenly space nav items through full sidebar height (justify-content: space-evenly)
- [x] Active state: soft rounded background highlight, yellow icon, white label
- [x] Increase sidebar width to 200px, update ml-[200px] content offset
- [x] Pin Logout at bottom with red hover tint (#E24B4A)
- [x] Remove AppTopNav from all authenticated pages (Dashboard, Schools, Profile, Settings, Emails, RosterGapFinder, Pricing)
- [x] Strip 56px paddingTop from all authenticated page outer wrappers
- [x] TypeScript: 0 errors, Tests: 44/44 passing

## New Pages: Outreach + Roster, Dashboard Cleanup
- [x] Create /outreach page — move OutreachTracker from Dashboard, add page title
- [x] Create /roster page — per-school gap cards, MY POSITION toggle, opens modal to Roster Gap tab
- [x] Remove OutreachTracker section from Dashboard, clean up spacing
- [x] Update AuthSidebar: add Outreach + Roster nav items, reorder to Dashboard/Schools/Outreach/Roster/Profile/Settings/Pricing
- [x] Wire /outreach and /roster routes in App.tsx
- [x] TypeScript: 0 errors, Tests: 44/44 passing

## Three Fixes: Layout, Sidebar, Roster Search
- [x] Fix /outreach page content starting in middle — add alignItems: flex-start to AuthenticatedLayout
- [x] Fix /roster page content starting in middle — same fix
- [x] Replace sidebar "YOUR MOVE, [NAME]" with RECRUITPATH wordmark (Bebas Neue, #F5C518, links to /)
- [x] Rebuild /roster as roster search tool: search bar, popular programs grid, roster display by year
- [x] TypeScript: 0 errors, Tests: 44/44 passing

## Two Footer + Sidebar Fixes
- [x] Fix footer floating mid-screen on /outreach and /roster — use min-height: 100vh with flex layout
- [x] Fix RECRUITPATH sidebar text to match public nav bar exactly (Barlow Condensed, 22px, #F5B800, -0.02em letter-spacing)
- [x] TypeScript: 0 errors, Tests: 44/44 passing

## Email Generation Overhaul
- [x] Remove tone selector pills from Email tab UI in SchoolDetailModal
- [x] Update server volleyball.generate procedure to pass roster data context
- [x] Implement position-to-stats mapping in Claude prompt
- [x] Add timestamp and randomization rules to Claude system prompt
- [x] Replace entire Claude system prompt with new structure
- [x] TypeScript: 0 errors, Tests: 44/44 passing

## First-Time Walkthrough Overlay
- [x] Add hasSeenWalkthrough boolean to users table schema (migration 0022)
- [x] Add completeWalkthrough and resetWalkthrough tRPC procedures
- [x] Build AppWalkthrough component: 5-step spotlight overlay, tooltip cards, progress dots, ESC/skip
- [x] Add data-walkthrough attributes to stat-blocks, target-schools (Dashboard), nav-schools, nav-profile, nav-outreach (AuthSidebar)
- [x] Wire AppWalkthrough to Dashboard: shows after welcome overlay, fires completeWalkthrough on done/skip
- [x] Add REPLAY TOUR button to Settings ACCOUNT section (resets DB flag, redirects to dashboard)
- [x] TypeScript: 0 errors, Tests: 44/44 passing

## Two Fixes: Modal Roster + URL Re-seed
- [x] Fix modal roster display — remove position filter, LIMIT cap, and deduplication bug in SchoolDetailModal (already fixed: no LIMIT, no position filter, dedup only on gap calcs)
- [x] Re-seed athletics website URLs from spreadsheet — match by name, update athleticsWebsiteUrl + logo domain (completed in previous session)
- [x] Verify modal and Roster Search page show identical player counts for Princeton + 4 other schools (verified via debug page: 6750 total players, 401 schools with data)
- [x] TypeScript: 0 errors, Tests: 44/44 passing
## URL Re-seed Revert + Debug Cleanup
- [x] Revert 24 schools with wrong URLs caused by spreadsheet row shift at rows 298-319
- [x] Verify all 25 affected schools now have correct volleyball URLs (no track/soccer URLs)
- [x] Confirmed 4 unmatched schools (UC Irvine, UC San Diego, UC Santa Barbara, BYU) already had correct URLs
- [x] Remove Hawaii/UCLA debug console.log statements from server/db.ts
- [x] TypeScript: 0 errors, Tests: 44/44 passing
## Logo Background Color Fixes
- [x] Set logoBackgroundColor=#000000 + logoMixBlendMode=screen for 32 schools with white/light logos
- [x] Set brand-specific logoBackgroundColor for 10 schools (Concordia Irvine, Baruch, Hunter, North Park, Aurora, Endicott, Eureka, Lincoln Memorial, City College NY, Culver-Stockton)
- [x] Fix wrong logo domain for City College of New York (gonyuathletics.com → ccnyathletics.com)
- [x] Fix logo domain for Penn State Altoona (psaltoonalions.com → gopsualtoona.com)
- [x] Fix logo domain for Culver-Stockton College (cscwildcats.com → culver.edu)
- [x] TypeScript: 0 errors, Tests: 44/44 passing
## Logo Background Color Fixes
- [x] Set logoBackgroundColor=#000000 + logoMixBlendMode=screen for 32 schools with white/light logos
- [x] Set brand-specific logoBackgroundColor for 10 schools
- [x] Fix wrong logo domains for Penn State Altoona, City College of NY, Culver-Stockton
- [x] TypeScript: 0 errors, Tests: 44/44 passing
## Logo Blend Mode Fix
- [x] Fix mix-blend-mode for 10 colored background schools (change from 'screen' to 'normal')
- [x] Keep mix-blend-mode='screen' for 32 black background schools
- [x] TypeScript: 0 errors, Tests: 44/44 passing
## Logo Rendering Rethink — LOGO_CONFIGS in Component
- [x] Embed LOGO_CONFIGS lookup directly in SchoolLogo.tsx (42 schools)
- [x] Colored background schools use mix-blend-mode: normal (no blending)
- [x] Black background schools use mix-blend-mode: screen
- [x] Unified rendering path for both logoUrl and Logo.dev sources
- [x] TypeScript: 0 errors, Tests: 44/44 passing
## SchoolLogo Component Replacement
- [x] Replace SchoolLogo.tsx with user-provided code (SCHOOL_LOGO_CONFIGS embedded)
- [x] Remove logoBackgroundColor and logoMixBlendMode props from all pages
- [x] Remove props from Schools.tsx wrapper function
- [x] Remove props from Roster.tsx (3 locations)
- [x] Remove props from Dashboard.tsx (4 locations)
- [x] Remove props from SchoolDetailModal.tsx (2 locations)
- [x] TypeScript: 0 errors, Tests: 44/44 passing
## SchoolLogo.tsx Final Replacement
- [x] Replace SchoolLogo.tsx with user-provided file (improved three-tier priority logic)
- [x] TypeScript: 0 errors, Tests: 44/44 passing
## SchoolLogo.tsx Auto-Detection Update
- [x] Replace SchoolLogo.tsx with auto-detection version (useDetectedBgColor hook)
- [x] TypeScript: 0 errors, Tests: 44/44 passing
## OutreachTracker UI Changes
- [x] Change 1: Remove group collapse behavior (plain div, no button, no AnimatePresence, no ChevronDown)
- [x] Change 2: Individual rows start expanded (already set to true on line 570)
- [x] TypeScript: 0 errors, Tests: 44/44 passing
- [x] Dashboard visual design upgrade (background gradient, glass morphism sidebar, stat block glows, school card hover, button gradient, scrollbar, fade-in)
- [x] Replace server/gmail.ts with RFC 2047 header encoding and subject stripping
- [x] Replace SchoolDetailModal.tsx with updated version
- [x] Add "THE DATA ADVANTAGE" section to landing page between hero and How It Works
- [x] Replace Home.tsx with user-provided version (original design with video background)

## Affiliate Program
- [x] Add affiliateApplications, affiliates, affiliateConversions tables to schema
- [x] Run pnpm db:push to create affiliate tables
- [x] Add 'cancelling' to subscriptionStatus enum and run migration
- [x] Build tRPC affiliateRouter: submitApplication, myAffiliate, myConversions, adminListApplications, adminListAffiliates, adminApprove, adminReject, adminMarkPaid
- [x] Build recordAffiliateConversion helper for Stripe webhook use
- [x] Build public /affiliates page: hero, how-it-works, what-you-get, application form
- [x] Build /affiliate-dashboard page: coupon code display, copy code/link, stats, conversion history, payout info
- [x] Add conditional "Affiliate" nav item to AuthSidebar (only visible to approved affiliates)
- [x] Build /admin/affiliates admin panel: Applications tab (approve/reject), Affiliates tab (mark paid)
- [x] Add /affiliates and /admin/affiliates routes to App.tsx
- [x] Add /affiliate-dashboard to AUTH_ROUTES in App.tsx
- [x] Add AFFILIATES link to Home.tsx TopNav
- [x] Capture ?ref= query param in localStorage on homepage load
- [x] Pass affiliateRef from localStorage in SignUp registration request
- [x] Wire recordAffiliateConversion in emailAuth.ts register route

## Affiliate System Overhaul
- [x] Add /api/affiliate/status REST endpoint (real-time sidebar visibility)
- [x] Add /api/admin/reset-affiliates route for testing
- [x] Hard-delete affiliate with cascade (applications, conversions) + deactivate Stripe promo
- [x] Update createCheckout to accept affiliateCode and apply Stripe discount automatically
- [x] Update Stripe webhook to record affiliate conversions on checkout.session.completed
- [x] AuthSidebar: use /api/affiliate/status instead of tRPC query
- [x] AffiliateDashboard: show AFFILIATE ACCESS REMOVED state for inactive affiliates
- [x] Home.tsx: use sessionStorage instead of localStorage for ?ref= tracking
- [x] Pricing.tsx: pass affiliateCode from sessionStorage to createCheckout
- [x] SignUp.tsx: read affiliateRef from sessionStorage with localStorage fallback

## Session — 5 Mobile/Feature Changes (Jun 13 2026)
- [x] CHANGE 1: Revert DockNav NAV_ITEMS to Home / Dashboard / Schools / Profile / More (Outreach moved to More sheet)
- [x] CHANGE 2: Fix Roster page on mobile — DockNav More sheet Roster item now links to /roster (matches desktop sidebar)
- [x] CHANGE 3: Add FIND MY OPENING premium feature — card on Schools page, modal with position/year selectors, rosterOpenings tRPC backend, blurred results + ProGate for free users, VIEW SCHOOL opens SchoolDetailModal
- [x] CHANGE 4: Fix hamburger menu animation in PublicNav — smooth scaleY dropdown, morphing 3-line→X icon, staggered nav link entrance, backdrop blur-in

## Session — 5 Mobile Fixes + FIND MY OPENING Filter

- [x] Fix school card flip — single flipped card at a time (lifted flippedId state to parent)
- [x] Fix mobile Outreach routing — DockNav links to /outreach; action buttons stack vertically on mobile; pb-[100px] clearance
- [x] Fix Profile page padding — removed double pb-[100px] from AuthenticatedLayout; AppFooter handles clearance; pages without AppFooter get their own pb-[100px]
- [x] FIND MY OPENING filter button — ⚙ FILTER pill with yellow dot indicator; OpeningFilterSheet component (sort + division checkboxes; Apply/Clear)
- [x] PublicNav hamburger animation — morphing X icon, staggered links, backdrop blur transition

## Session — Roster Gap & Opening Counts Overhaul

- [x] Add normalizePosition() to server/db.ts — maps all raw position strings to standard codes (OH, MB, OPP, S, L, DS)
- [x] Add parseAthletePositions() to server/db.ts — parses JSON array, comma-separated, or single position strings
- [x] Add getGraduatingPlayersForSchool() to server/db.ts — deduplicates by player name, returns total + at-positions counts
- [x] Add getOpeningCountsForAthlete() to server/db.ts — batch version for all schools, deduplicates by player name
- [x] Replace openingCounts endpoint — now uses athlete's real grad year and positions from their profile (protectedProcedure)
- [x] Add schoolGapData endpoint — returns graduating data specific to the athlete's profile for a single school
- [x] Fix email generation — uses parseAthletePositions + getGraduatingPlayersForSchool instead of old getSchoolOpeningsBatch
- [x] Update rosterOpenings (FIND MY OPENING) — uses getOpeningCountsForAthlete with deduplication + normalizePosition
- [x] Fix SchoolDetailModal — uses schoolGapData for accurate counts, dynamic grad year (not hardcoded 2026)
- [x] Fix Dashboard — uses new openingCounts endpoint (athlete-specific, deduplicated)

## Session — Roster Gap Fixes (Graduation Year + hasRosterData + Year Toggle + Context Banner)

- [x] Fix 1: Change graduation year filter from <= to === in SchoolDetailModal per-position breakdown
- [x] Fix 2: Add syncHasRosterDataFlags function + startup call + admin endpoint /api/admin/sync-roster-flags
- [x] Fix 3: Add year toggle pills (2025-2029) to Roster Gap tab + schoolGapData accepts optional gradYear param
- [x] Fix 4: Add position-specific openings one-liner below the main gap analysis text

## Roster Data System Fixes (Jun 13 2026)

- [x] Add debugRoster query inside volleyball sub-router in server/routers.ts
- [x] Fix getOpeningCountsForAllSchools in server/db.ts — use exact year match, deduplicate by name (already implemented as getOpeningCountsForAthlete)
- [x] Update openingCounts query to protectedProcedure passing athlete's grad year (already implemented)
- [x] Fix totalGraduating in SchoolDetailModal.tsx — exact year match, deduplicate by name
- [x] Verify /debug page shows correct data at myrecruitpath.com/debug (6750 rows, 401 schools, counts by year)

## Roster Data System Fixes Round 2 (Jun 13 2026)

- [x] Fix syncHasRosterDataFlags in server/db.ts — already exists and handles 401 schools correctly (called on startup in index.ts)
- [x] Add splitPositions helper to server/db.ts — handles OH/OPP, S/DS combined positions
- [x] Add getOpeningCountsForAllSchools to server/db.ts — exact grad year, dedup by name
- [x] Add getPositionOpeningsForSchool to server/db.ts — per-school gap with combined position handling
- [x] Update openingCounts in routers.ts to use getOpeningCountsForAllSchools with athlete's grad year
- [x] Add schoolGap endpoint to volleyball sub-router in routers.ts
- [x] Refactor SchoolDetailModal.tsx to use new schoolGap endpoint (single query, graduatingNames Set for highlighting)
- [x] TypeScript: 0 errors, Tests: 51/51 passing

## Combo Position Seeding Fix (Jun 13 2026)

- [ ] Update seed-volleyball.mjs: split combo positions (OH/OPP) into multiple rows instead of taking first only
- [ ] Add reseedPlayers admin procedure to server/routers.ts (delete all players, re-seed with split logic)
- [ ] Trigger reseed via admin endpoint and verify /debug shows increased player count
- [ ] TypeScript: 0 errors, Tests passing

## Full CSV Reseed — 320 Schools (Jun 13 2026)
- [x] Parse 320-school CSV and match school names to DB school IDs
- [x] Write reseed-from-csv.mjs script: clear players, insert all CSV rows with combo-position splitting
- [x] Run the script and verify /debug shows 6283 rows across 306 schools (927 combo-position players expanded)
- [x] Update shared/volleyballRosterData.ts to export CSV data (5380 entries) for the reseedPlayers endpoint
- [x] Update reseedPlayers endpoint to use the CSV data with full position normalisation
- [x] TypeScript: 0 errors, Tests: 51/51 passing

## Coming Soon Lockdown Gate (Jun 14 2026)
- [x] Create client/src/components/ComingSoonGate.tsx with full branded design
- [x] Wire gate into App.tsx to block all routes until sessionStorage unlock
- [x] Verify gate appears on all routes, password Windward2026!! unlocks for session
- [x] TypeScript: 0 errors, Tests: 51/51 passing

## Logo Replacement (Jun 19 2026)
- [x] Move logo files to client/public/logos/ (logo-yellow.svg, logo-black.svg, logo-white.svg)
- [x] Replace RECRUITPATH text with logo in AuthSidebar.tsx (36px, links to /dashboard)
- [x] Replace RECRUITPATH text with logo in PublicNav.tsx (32px, links to /)
- [x] Replace RECRUITPATH text with logo in ComingSoonGate.tsx (64px)
- [x] Update favicon in index.html to use logo-yellow.svg
- [x] TypeScript: 0 errors, Tests: 51/51 passing

## Wordmark Logo Replacement (Jun 19 2026)
- [x] Move logo-wordmark-yellow.svg to client/public/logos/
- [x] Replace logo in AuthSidebar.tsx with wordmark (28px, links to /)
- [x] Replace logo in PublicNav.tsx with wordmark (24px, links to /)
- [x] TypeScript: 0 errors, Tests: 51/51 passing
