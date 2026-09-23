# Progress Tracker — Multistage AI Chat Agent

**Overall completion: 97% (Phases 1–6 complete)**

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
- [x] 3.1 Groq SDK integration + system prompt design — 5%
- [x] 3.2 Stage classifier call — 6%
- [x] 3.3 Tool registry + dispatcher — 6%
- [x] 3.4 Tool-calling loop (multi-turn execution + response synthesis) — 8%

## Phase 4 — The 4 lifecycle workflows wired to agent core (20%)
- [x] 4.1 New Lead workflow — 5%
- [x] 4.2 Ongoing Pipeline workflow — 5%
- [x] 4.3 Booked Vehicle workflow — 5%
- [x] 4.4 Post-Purchase / Service workflow — 5%

## Phase 5 — Frontend chat UI (15%)
- [x] 5.1 Chat UI scaffold (Vite + React + TS) — 5%
- [x] 5.2 Message rendering + stage indicator — 5%
- [x] 5.3 API integration + session handling (localStorage sessionId) — 5%

## Phase 6 — State management + end-to-end testing of all 4 scenarios (7%)
- [x] 6.1 Redis session store wiring — 2%
- [x] 6.2 E2E test: New Lead scenario (via UI) — 1.25%
- [x] 6.3 E2E test: Ongoing Pipeline scenario — 1.25%
- [x] 6.4 E2E test: Booked Vehicle scenario — 1.25%
- [x] 6.5 E2E test: Post-Purchase scenario — 1.25%

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
- **Bug fix during Phase 3:** `searchBooking` could previously only look a
  Deal up by phone or Zoho's internal record id — not by the human-readable
  `Booking_Id` field (e.g. `BK-2024-00123`) that the brief and the seed
  script's own printed test instructions actually use. Fixed to do a
  proper criteria search on `Booking_Id`.

### Notes from Phase 3
- **Two-call design implemented as planned** (`ARCHITECTURE.md` §3):
  `classifier.ts` does a no-tools, forced-JSON, temperature-0 call with the
  prior stage as a sticky default; `agentService.ts` then builds a
  stage-scoped system prompt + tool list and runs `toolLoop.ts`'s
  execute/respond loop (capped at 4 iterations) via Groq's native tool
  calling. Verified offline (no Groq/Zoho calls needed for this part):
  each stage exposes exactly its own tools, and invalid tool arguments
  come back as a specific Zod error message rather than a crash.
- **Refinement vs. the original §3 plan:** instead of hiding an incomplete
  tool until a separately-tracked `pendingFields` object is complete, tool
  arguments are Zod-validated at call time and validation errors are fed
  back to the model as the tool result. The model reads "email: Required"
  and asks for it naturally on the next turn — same effect, less state to
  track in this phase. Can add the stricter hide-until-ready gating in
  Phase 4 if you'd rather have it.
- **Simplification vs. §4's tool inventory:** `find_contact` isn't exposed
  as its own callable tool. `search_deal`, `search_booking`, and
  `create_case` each resolve their phone→Contact lookup internally as part
  of doing their real job, instead of making the model call a separate
  lookup tool first — fewer tools on the table per turn, one less round
  trip.
- **Live-verified end to end (New Lead flow)** via `npm run test:agent`:
  stage classification stayed sticky on `new_lead` across 5 turns
  (confidence 0.97–0.99 throughout), the agent collected name/phone/email/
  city one or two fields at a time as instructed, then correctly called
  `create_lead` only once all five fields were present — creating a real
  Zoho Lead (ID `1435640000000552006`). The other 3 stages (ongoing
  pipeline, booked vehicle, post-purchase) haven't been manually exercised
  yet — worth trying via `npm run test:agent` using the phone/Deal ID/
  Booking ID from the Phase 2 seed output.
- **Bug found via your first live test:** the default `GROQ_MODEL`,
  `llama-3.3-70b-versatile`, was decommissioned by Groq on Aug 16, 2026 —
  after my knowledge cutoff, so it wasn't a stale-training-data guess I
  could've caught by reasoning alone. Changed the default (`env.ts`,
  `.env.example`, `ARCHITECTURE.md` §10.1) to `openai/gpt-oss-120b`, Groq's
  own recommended replacement for tool-calling workloads (confirmed via a
  live web search, not assumed) — `openai/gpt-oss-20b` is a lighter
  fallback noted in `.env.example` if you hit free-tier rate limits. If
  your local `backend/.env` already has `GROQ_MODEL` set explicitly (not
  just relying on the default), update or remove that line too.

### Notes from Phase 4
- **What was actually left after Phase 3:** the agent core (classify →
  stage-scoped tools → tool loop) already handled all 4 lifecycle stages
  generically — there was no separate per-stage logic to write. What was
  genuinely missing was the HTTP layer connecting it to the world:
  `POST /chat`, request validation, a session store, and centralized error
  handling. That's what Phase 4 built.
- **`sessionService.ts`** — an in-memory `Map<sessionId, Session>` for now.
  Deliberately built with the exact function signatures
  (`getOrCreateSession`, `updateSession`) that Phase 6 will keep when it
  swaps the `Map` for Redis + a TTL — the controller won't need to change.
  Known limitation until then: restarting the backend loses every session,
  and it won't work across multiple backend instances. Fine for a single-
  process dev/demo setup.
- **`chatController.ts`** — validates `{sessionId, message}` with Zod,
  loads (or creates) the session, appends the user message, calls
  `runAgentTurn`, persists the result, responds with
  `{sessionId, reply, stage, toolCalls}`. The client only ever needs to
  remember `sessionId` — the server owns conversation history and stage
  entirely, which is what lets Phase 5's frontend stay simple.
- **Error handling** — a centralized `errorHandler` middleware returns
  400s with specific field errors for bad requests (Zod validation
  failures) and a generic, safe 500 for anything else — the real error is
  logged server-side but never leaked to the client. `asyncHandler` wraps
  the controller so a rejected promise reaches this middleware instead of
  hanging the request (Express 4 doesn't do this automatically).
- **Live-verified via curl** (no Groq/Zoho credentials needed for this
  part): `/health` → 200, missing/empty body → 400 with correct field
  names, valid body without `GROQ_API_KEY` configured → clean 500 with the
  real error only in the server log. Full `/chat` flow against real
  Groq/Zoho still needs a run on your machine — same credential boundary
  as before.

### Notes from Phase 5
- **`ChatWindow.tsx`** is the only stateful component — holds the message
  list, current stage, sending/error state, and calls `sendChatMessage` on
  submit. `MessageBubble`, `ChatInput`, `StageIndicator` are all plain,
  presentation-only components underneath it.
- **`useSession.ts`** generates a `crypto.randomUUID()` once per browser
  and persists it in `localStorage`, wrapped in try/catch since storage
  can throw in private browsing / blocked-storage cases — falls back to an
  in-memory id for that page load rather than crashing.
- **Styling** kept to the "minimal/neutral" default from `ARCHITECTURE.md`
  §10.5 — system font stack, CSS variables with a `prefers-color-scheme`
  dark variant, no UI library. Functional over branded, per that default.
- **Live-verified in an actual browser** (per the working agreement's rule
  to test UI changes visually, not just typecheck): ran both dev servers
  and drove the page with Playwright.
  - Initial render: header, "Not started" stage badge, empty-state copy —
    all correct.
  - Typed and sent a message → user bubble renders immediately → backend
    call fails (500, no `GROQ_API_KEY` in this sandbox — same boundary as
    every other live test so far) → error banner shows a clean message,
    the user's message is **not** lost from the transcript, and the input
    re-enables itself. This is the failure path a real user could hit
    (backend down, bad network) and it degrades gracefully rather than
    hanging or showing a raw error.
  - `sessionId` confirmed written to `localStorage` in the correct UUID
    format.
  - Screenshots of both states were reviewed, not just the console
    assertions — layout, spacing, and bubble alignment all render as
    intended at a 500px mobile-ish width.
  - **Not yet visually confirmed:** a real successful reply rendering (the
    assistant bubble, stage badge updating to e.g. "New Lead") — that
    needs your `GROQ_API_KEY`/Zoho credentials, same as Phases 3–4's full
    live tests.

- **Bug found via your first live test:** assistant replies contain
  Markdown (bold, GFM tables, literal `<br>` tags for multi-line cells —
  the Bolero spec table you sent a screenshot of) and `MessageBubble` was
  rendering it as a plain `<p>`, so the raw syntax showed up as literal
  text. Fixed by rendering assistant messages (only — user messages stay
  plain text) through `react-markdown` + `remark-gfm`, added as new
  frontend dependencies. Deliberately did **not** enable raw-HTML
  rendering to support the `<br>` tags (that would open up arbitrary
  HTML/script rendering from LLM- or CRM-sourced content) — instead
  `normalizeContent()` converts `<br>` variants to real Markdown line
  breaks before rendering, so the same visual result is achieved without
  that risk. You chose this over the "force plain text via system prompt"
  alternative when asked, since tabular spec data (like the Bolero
  example) genuinely reads better as a real table.
  - **Live-verified**: seeded the exact table/bold/`<br>` content you
    reported broken (temporarily, reverted before committing — never
    shipped as dead code) and confirmed via Playwright: real `<table>`
    and `<strong>` elements render, no literal `<br>` or `**` text
    remains visible. Screenshot reviewed, not just DOM assertions.

### Notes from Phase 6
- **`sessionService.ts` swapped from an in-memory `Map` to Redis** exactly
  as planned back in Phase 4 — same `getOrCreateSession`/`updateSession`
  function names and shapes (now `Promise`-returning), so `chatController`
  only needed two `await` keywords added, nothing else. `redisClient.ts`
  is a small singleton wrapping `ioredis`, reading `REDIS_URL` from config.
- **TTL is sliding, not fixed-from-creation**: every `updateSession` call
  (i.e. every completed turn) does a Redis `SET ... EX <SESSION_TTL_SECONDS>`,
  which resets the expiry. An abandoned conversation expires
  `SESSION_TTL_SECONDS` after its *last* message, not its first.
- **A session is only written to Redis on a successful turn.** If
  `runAgentTurn` throws (bad Groq/Zoho call, etc.), `updateSession` never
  runs, so nothing half-initialized gets persisted — a retry just starts
  clean. Verified this directly: hit `/chat` with valid input but no
  `GROQ_API_KEY` configured (expected 500), then checked
  `redis-cli KEYS "session:*"` — empty, confirming no stray key.
- **Live-verified against a real local Redis instance** (started
  `redis-server` in this sandbox — no credentials needed for this part):
  a throwaway script exercised `getOrCreateSession` → `updateSession` →
  reload → wait 1.2s → `updateSession` again, confirming: a fresh session
  has `stage: null, messages: []`; TTL is set to the configured 1800s on
  first write; `createdAt` is preserved across updates while
  `lastActiveAt` advances; and TTL resets to 1800s on the second update
  (the sliding-TTL behavior working, not just present).
- **What's left for Phase 6 is on you**: 6.2–6.5 are you running all 4
  lifecycle stages through the real browser UI (not the CLI harness) with
  your Groq/Zoho credentials and **a Redis instance actually running** —
  none of this has a fallback if Redis is down, by design (that's the
  point of moving off the in-memory Map). See the test script in my reply
  for exact phone numbers/IDs to use from the Phase 2 seed data.

- **Redis connection debugging (your live tests):** two rounds of fixes
  to `redisClient.ts` based on real failures you hit — first a fail-fast
  check + capped retries (instead of retrying/logging forever) for the
  case of pointing `REDIS_URL` at an HTTP(S) URL by mistake, then
  connection-lifecycle event logging (`connect`/`ready`/`reconnecting`)
  plus a safe host/port/TLS printout, since `MaxRetriesPerRequestError`
  itself carries zero information about *why* a command never got a
  response. Root cause turned out to be Upstash's `redis-cli --tls -u
  redis://...` snippet using a separate `--tls` flag for TLS, which
  doesn't exist for a plain `REDIS_URL` string — needed `rediss://`
  (double s) in the URL scheme itself for `ioredis` to enable TLS.

- **Bug found via your Booked Vehicle live test:** searching by phone
  `9820055667` returned "no booking found" even though it's Priya Iyer's
  seeded number — because it's stored in Zoho as `+919820055667` and
  Zoho's Phone-field search only supports `equals` (confirmed against
  Zoho's own API docs — no `contains` operator exists for Phone fields),
  so an exact-format mismatch is a silent false negative, not an error.
  Fixed with `utils/phone.ts`'s `normalizeIndianPhone()`, applied in
  `findContactByPhone` (the single choke point `search_deal`,
  `search_booking`, and `create_case` all go through for phone lookups —
  one fix covers all three) and in `createLead` on the write side, so
  future data stays in the same canonical format. Verified the
  normalization directly against 7 realistic input variations (with/
  without `+91`, spaces, dashes, parens, leading trunk `0`) — all
  collapse to the same `+91XXXXXXXXXX` value the seed data uses.

- **Also found in that same test:** when no booking matched, the
  assistant invented a fake fallback phone number and email
  (`+91 22 1234 5678`, `sales@mahindradealer.com`) that don't exist
  anywhere in the CRM or the system prompt — a real hallucination, not
  just an unhelpful reply. The persona instructions already said "never
  invent CRM data," but apparently that didn't read as covering fabricated
  *contact* details. Strengthened `systemPrompt.ts`'s `PERSONA` to say so
  explicitly.

- **Root cause of the Booked Vehicle failures, found by inspecting the
  Zoho record directly**: it was never actually the phone-format bug
  alone. The seed script's `Stage: "Closed Won - Booking Done"` write was
  silently dropped by Zoho — a fresh org doesn't have that value
  configured in the Deals Stage picklist, and rather than erroring, Zoho
  fell back to the standard `Closed Won` stage. `searchBooking`'s exact
  match against the custom string was never going to succeed. Changed
  `BOOKING_STAGE` (`types/zoho.ts`) to the standard `"Closed Won"` value
  instead of requiring a manually-configured custom stage — your explicit
  call over the alternative (properly adding the custom stage in Zoho
  Setup) when asked. Documented as a deliberate deviation from the
  brief's literal wording in `ARCHITECTURE.md` §12, including the
  trade-off (any `Closed Won` Deal now matches, not just ones that are
  specifically vehicle bookings — fine at this project's scale, would
  want `Booking_Id` non-empty as a second condition for production).
  All three places the old string appeared (`types/zoho.ts`,
  `bookingTools.ts`'s tool description/error text, both docs) now derive
  from or reference the single constant.

- **Third bug in this same chain, found after the Contact lookup started
  succeeding but the booking still didn't resolve**: `getDealsForContact`
  (`GET /Contacts/{id}/Deals`) was returning Deal records stripped of
  `Stage` and every custom field. Confirmed via Zoho's own API docs —
  their "Get Related Records" endpoint treats the `fields` parameter as
  **mandatory** (unlike the regular Get/Search Records endpoints we use
  elsewhere, where it's optional and full data comes back by default);
  omitting it silently returns a reduced record instead of erroring. Since
  `searchBooking`'s phone branch filters on `deal.Stage === BOOKING_STAGE`,
  every Deal fetched this way looked like it had no stage at all. Fixed
  by explicitly requesting every field `ZohoDeal` reads via `fields=...`.
  **This bug also silently affected Ongoing Pipeline's phone-based
  `search_deal`** (same underlying function) — it wasn't caught yet only
  because that flow hadn't been retested after the earlier fixes; the
  returned `stage`/`followUpPreference` would have come back `null` even
  for a real Deal. Added diagnostic logs to both `findContactByPhone` and
  `getDealsForContact` (Contact found/not-found, and each Deal's id+Stage)
  so this class of "found the record but the data came back empty" bug is
  visible in the terminal immediately next time, not another guessing
  round.

- **All 4 lifecycle stages confirmed working end-to-end via the real UI**
  (New Lead, Ongoing Pipeline including `update_deal_followup`, Booked
  Vehicle, Post-Purchase/Service) — Phase 6 complete. Getting here
  surfaced and fixed five real bugs beyond the original Phase 3/4 build:
  the deprecated Groq model, a reasoning-model token-budget issue in the
  classifier, phone-format false negatives, the custom booking-stage
  value silently not saving in a fresh Zoho org, and `fields` being
  mandatory (not optional) on Zoho's Get Related Records endpoint. Every
  one of them was found through actual live testing against real
  Groq/Zoho, not caught by typecheck/lint/offline smoke tests — which is
  exactly why this phase existed.
