# Progress Tracker — Multistage AI Chat Agent

**Overall completion: 30% (Phases 1–2 complete)**

Weights per your working agreement. Each phase's sub-tasks sum to that
phase's weight; all phases sum to 100%.

---

## Phase 1 — Planning & scaffolding (10%)
- [x] 1.1 Architecture & design docs (`ARCHITECTURE.md`, this file, folder tree) — 4%
- [x] 1.2 Repo scaffolding (frontend + backend folders, tsconfig, eslint, package.json) — 4%
- [x] 1.3 Env/config setup (`.env.example`, config loader) — 2%

## Phase 2 — Zoho CRM integration (OAuth + CRUD wrappers + mock data) (20%)
- [x] 2.1 OAuth 2.0 Self Client setup + access-token refresh service — 6%
- [x] 2.2 Leads module CRUD wrapper — 4%
- [x] 2.3 Deals/Potentials module CRUD wrapper — 4%
- [x] 2.4 Cases/Service Tickets module CRUD wrapper — 4%
- [x] 2.5 Seed script (1 Lead, 1 Deal, 1 Booking) — 2%

## Phase 3 — LLM agent core (intent classification + tool calling) (25%)
- [ ] 3.1 Groq SDK integration + system prompt design — 5%
- [ ] 3.2 Stage classifier call — 6%
- [ ] 3.3 Tool registry + dispatcher — 6%
- [ ] 3.4 Tool-calling loop (multi-turn execution + response synthesis) — 8%

## Phase 4 — The 4 lifecycle workflows wired to agent core (20%)
- [ ] 4.1 New Lead workflow — 5%
- [ ] 4.2 Ongoing Pipeline workflow — 5%
- [ ] 4.3 Booked Vehicle workflow — 5%
- [ ] 4.4 Post-Purchase / Service workflow — 5%

## Phase 5 — Frontend chat UI (15%)
- [ ] 5.1 Chat UI scaffold (Vite + React + TS) — 5%
- [ ] 5.2 Message rendering + stage indicator — 5%
- [ ] 5.3 API integration + session handling (localStorage sessionId) — 5%

## Phase 6 — State management + end-to-end testing of all 4 scenarios (7%)
- [ ] 6.1 Redis session store wiring — 2%
- [ ] 6.2 E2E test: New Lead scenario — 1.25%
- [ ] 6.3 E2E test: Ongoing Pipeline scenario — 1.25%
- [ ] 6.4 E2E test: Booked Vehicle scenario — 1.25%
- [ ] 6.5 E2E test: Post-Purchase scenario — 1.25%

## Phase 7 — Docs, architecture diagram, demo video prep (3%)
- [ ] 7.1 README (setup + execution steps) — 1.5%
- [ ] 7.2 Architecture diagram (visual, exported image) — 1%
- [ ] 7.3 Demo video prep notes (script/checklist) — 0.5%

---

### Notes from Phase 2
- **Deviation from the Phase 1 folder tree:** `scripts/seed-zoho.ts` and
  the new `scripts/zoho-get-refresh-token.ts` live under `backend/scripts/`,
  not a top-level `scripts/`. Reason: they import backend service code and
  need to resolve `backend/node_modules` (axios, dotenv, tsx) — Node's
  module resolution walks up from the importing file, and a sibling
  top-level `scripts/` isn't an ancestor of `backend/node_modules`, so it
  would need its own separate `npm install` of the same packages. Nesting
  them avoids that duplication.
- **Deviation from ARCHITECTURE.md §4's tool list:** added a small
  `contactsService.ts` (not in the original file list) so `find_contact`
  has one home shared by both `dealsService` and `casesService`, instead
  of duplicating the Contacts lookup in each.
- `docs/ZOHO_FIELDS.md` now has the concrete API-name mapping (which
  fields are standard vs. custom you need to create) — was previously just
  referenced, not written.
- **Live-verified against a real Zoho org** — OAuth exchange, token
  refresh, and all 3 seed records (Lead `1435640000000549006`, pipeline
  Deal `1435640000000552001`, booking Deal `1435640000000553001` /
  `BK-2024-00123`) created successfully via `npm run seed:zoho`. Phase 2
  is confirmed working end-to-end, not just typechecked.
