# Architecture — Multistage AI Chat Agent (Automotive OEM / Zoho CRM)

Status: **Planning draft — awaiting approval before implementation.**

## 1. What this system does

A chat agent that talks to three kinds of people about one automotive OEM:
unidentified website visitors, existing prospects/owners, and returning
customers with a vehicle already booked or owned. Depending on what the
person says, the agent routes into one of four **lifecycle stages** and
reads/writes the corresponding Zoho CRM module:

| Stage | Trigger | CRM module | Primary action |
|---|---|---|---|
| 1. New Lead | Unidentified visitor asks about models/pricing | `Leads` | Create lead record |
| 2. Ongoing Pipeline | Known prospect gives phone/deal ID | `Deals` (Potentials) | Search + update follow-up prefs |
| 3. Booked Vehicle | Customer gives Booking ID / phone | `Deals` (stage = Closed Won, see §12) | Read allocation/VIN/delivery status |
| 4. Post-Purchase / Service | Owner logs complaint / books service | `Cases` (Service Tickets) | Create case linked to Contact |

There is no separate "form" UI — the whole interaction happens in one chat
box. The LLM decides what to say and which CRM operation to invoke; the
backend guarantees that operation only fires with valid, complete data.

## 2. High-level request flow

```
┌──────────────┐   POST /chat  {sessionId, message}   ┌───────────────────────┐
│ React Chat UI │ ────────────────────────────────────▶│ Express API            │
└──────────────┘                                        │  routes → controllers  │
       ▲                                                 │  → services            │
       │        { reply, stage, uiHints }                └──────────┬────────────┘
       └─────────────────────────────────────────────────────────────┘
                                                                     │
                        ┌────────────────────────────────────────────┼─────────────────────────┐
                        ▼                                            ▼                          ▼
                ┌───────────────┐                           ┌────────────────┐        ┌──────────────────┐
                │ Redis          │◀── read/write session ───│ Agent Core      │        │ Mongo (optional)  │
                │ (session state)│                           │ (Groq loop)     │        │ transcript/audit  │
                └───────────────┘                           └────────┬────────┘        └──────────────────┘
                                                                      │ tool_calls
                                                                      ▼
                                                             ┌─────────────────┐
                                                             │ Zoho CRM Service │
                                                             │ (axios + OAuth)  │
                                                             └─────────────────┘
                                                                      │
                                                                      ▼
                                                          Leads / Deals / Cases modules
```

One HTTP round trip per user message. Everything the agent needs to keep
across turns (chat history, which stage it's in, fields collected so far)
lives in Redis, keyed by `sessionId`. The backend is stateless between
requests — this is what lets it scale horizontally and what makes it
possible to unit-test the agent core independently of any real HTTP session.

## 3. Intent classification & stage routing

**This is the part of the system the "accuracy in tool routing" rubric
criterion is scoring, so it gets a deliberate, inspectable design rather
than "throw all 12 tools at the model and hope."**

Two LLM calls per user turn, not one:

**Call 1 — Stage classifier** (cheap, no tools, forced JSON output).
Input: the last few turns + the stage Redis has stored for this session
(if any). Output: `{ stage: "new_lead" | "ongoing_pipeline" | "booked_vehicle" | "post_purchase" | "continue", confidence }`.
The current stored stage is given to the model as a strong prior — a
session already in `post_purchase` shouldn't flip to `new_lead` because the
user says "hi". `continue` means "nothing changed, keep going." This call
is logged (stage in → stage out → why) so stage transitions are auditable
during the demo/debugging, which is the whole point of not using a
framework that hides this step inside an abstraction.

**Call 2 — Response + tool-calling loop** (Groq native tool calling).
Only the tool definitions belonging to the *classified* stage are sent to
the model — 2-4 tools instead of all ~10. This is the main lever for tool
routing accuracy: a smaller, stage-scoped toolset makes it structurally
harder for the model to call the wrong CRM function, and it's cheap to do
because we already know the stage from Call 1. The model can still emit
plain text (asking for a missing field, answering a product question) or a
`tool_call`; the backend executes any tool calls, appends results as `tool`
role messages, and loops until the model returns a final assistant message
(standard Groq/OpenAI-style tool loop, capped at a few iterations to avoid
runaway loops).

**Why two calls instead of one call with every tool available:**
one extra ~200ms Groq call per turn, in exchange for smaller/more accurate
tool selection and a clean, loggable "routing decision" artifact — a
direct, visible tradeoff rather than something a framework would decide
for you. This is a default; if you'd rather do single-call routing (model
picks stage implicitly by which tool it calls, no separate classifier), say
so and I'll switch — it's a real alternative, not a strawman.

**Field collection:** each stage's required fields are defined in code, not
just in the prompt (e.g. New Lead needs Name/Phone/Email/City/Model). The
system prompt instructs the model to keep asking until all required fields
are present in the conversation; the backend independently tracks which
required fields are already known (`pendingFields` in Redis) and simply
never sends the "create" tool's definition to the model until the missing
set is empty. Defense in depth: even if the model hallucinates a premature
tool call, it physically doesn't have that tool available yet.

## 4. Tool inventory (per stage)

Each tool is a plain function `(args, sessionContext) => result`, registered
in a central registry so execution and logging are uniform regardless of
which stage exposed it.

- **Shared**
  - `find_contact(phone)` — looks up an existing Zoho Contact by phone. Used to confirm "is this a known person" and to link Cases correctly.
- **New Lead**
  - `create_lead({name, phone, email, city, vehicleModel})`
- **Ongoing Pipeline**
  - `search_deal({phone?, dealId?})`
  - `update_deal_followup({dealId, followUpPreference})`
- **Booked Vehicle**
  - `search_booking({bookingId?, phone?})` — same underlying Deals module as pipeline, filtered to stage `Closed Won` (see §12); returns allocation stage / VIN / payment link.
- **Post-Purchase / Service**
  - `create_case({contactId, registrationNumber, odometerReading, issueType, preferredServiceCenter})`

All Zoho calls go through one `zohoClient` service (axios) that owns OAuth
token storage/refresh — the tools themselves never touch tokens.

## 5. Zoho CRM OAuth (Self Client)

**What this is, for anyone new to it:** Zoho's "Self Client" OAuth grant is
meant for server-to-server integrations where there's no interactive user
login screen — you generate a grant token once in the Zoho API Console,
exchange it for a long-lived **refresh token**, and your backend then mints
short-lived **access tokens** (~1hr) from that refresh token forever,
without a human in the loop. This fits us exactly: the chat backend, not an
end user, is the thing talking to Zoho.

- Refresh token is generated once (manually, during setup) and stored as an
  env var (`ZOHO_REFRESH_TOKEN`).
- A small token manager in `zohoClient` requests a new access token
  whenever the cached one is expired/near-expiry, caches it in memory (and
  optionally Redis, so a backend restart doesn't force an immediate refresh
  call), and attaches it to every CRM request.
- No SDK — plain `axios` calls to `https://www.zohoapis.<dc>/crm/v X/...`,
  per the stack lock. This keeps every request/response visible for
  debugging instead of hidden behind a client library.

## 6. Session/conversation state (Redis)

**What this is:** Redis is an in-memory key-value store, used here purely
as short-lived session storage — not a database of record. Each browser
session gets a `sessionId` (generated client-side, kept in
`localStorage`), and everything the agent needs to keep between messages is
stored under `session:<sessionId>` with a sliding TTL (default 30 min,
configurable) so abandoned conversations clean themselves up.

Schema (conceptual, not final field names):
```
{
  sessionId: string,
  stage: "new_lead" | "ongoing_pipeline" | "booked_vehicle" | "post_purchase" | null,
  messages: [ {role, content, tool_calls?, tool_call_id?, name?} ],   // full Groq-format history
  pendingFields: { [field]: value },        // partial data for the in-progress CRM action
  crmContext: { contactId?, dealId?, bookingId? },  // cached once resolved, avoids re-lookup
  createdAt, lastActiveAt
}
```

Why Redis and not just holding it in server memory or in Postgres: session
state is ephemeral, per-user, and read/written on every single message —
Redis is built for exactly that access pattern (sub-millisecond, TTL
built-in) and stack requirement locks it in anyway.

## 7. MongoDB (optional, audit-only)

If used at all, Mongo stores an **append-only transcript log**
(`{sessionId, timestamp, role, content, toolCalls?, stageAtTime}`) purely so
the demo video can show "here's the full conversation + every CRM call that
resulted from it" in one place. It is explicitly **not** used to model
Leads/Deals/Cases — Zoho stays the single system of record for CRM data, so
there's never a sync-conflict question between Mongo and Zoho. This is
scoped as a nice-to-have for Phase 7, not required for the core loop to
work.

## 8. Backend layering (why routes → controllers → services)

- **routes/** — HTTP surface only: path + method → controller function. No logic.
- **controllers/** — request/response shape: pull `sessionId`/`message` off
  the request, call the relevant service, shape the JSON response, map
  thrown errors to status codes. No business logic, no direct Zoho/Redis/Groq calls.
- **services/** — all the actual logic: `agentService` (runs the two-call
  loop above), `zohoService` (OAuth + CRUD per module), `sessionService`
  (Redis read/write), `toolRegistry` (tool defs + dispatch).

This is a plain layered architecture, not a framework — explicitly per the
stack lock (no NestJS, no DI container). The separation still matters
because it's what makes each piece independently testable: you can unit
test `zohoService.createLead` with a mocked axios instance, or test
`agentService`'s stage-classification logic with a mocked Groq client,
without spinning up Express or Redis at all.

## 9. Frontend

Vite + React + TypeScript, deliberately plain per the brief (no design
system mandated). A single chat view: message list, input box, a small
"current stage" indicator (useful for demoing/debugging routing — shows
the reviewer the stage is actually changing, not just the UI). Talks to the
backend over one `POST /chat` endpoint. `sessionId` is generated once with
`crypto.randomUUID()` and persisted in `localStorage` so a page refresh
resumes the same Redis session rather than starting a new one (**default —
say if you'd rather it reset per visit**).

## 10. Defaults I'm assuming (flagging per the "ask, don't assume" rule)

These aren't stack choices (those are locked) — they're implementation
details where the brief didn't specify an exact value. Stated as defaults;
override any of them in your approval reply and I'll build it that way instead.

1. **Groq model:** `openai/gpt-oss-120b` for both the classifier and the
   main tool-calling loop (classifier call uses a short max_tokens / JSON
   mode; same model keeps things simple — could swap the classifier to a
   smaller/faster Groq model later if latency matters). Originally planned
   as `llama-3.3-70b-versatile`, but Groq decommissioned that model in
   August 2026 — `openai/gpt-oss-120b` is Groq's own recommended
   replacement for tool-calling workloads; `openai/gpt-oss-20b` is a
   lighter fallback if you hit free-tier rate limits.
2. **Zoho custom field API names:** I don't know your actual Zoho CRM field
   setup (e.g. is "vehicle model" already a custom field on Leads, and what's
   its API name?). Default assumption: I'll create a documented custom field
   `Vehicle_Model` (Leads), reuse standard `Stage` on Deals, and a custom
   field set on Cases (`Registration_Number`, `Odometer_Reading`,
   `Issue_Type`, `Preferred_Service_Center`) — all defined explicitly in
   `docs/ZOHO_FIELDS.md` so you can rename them to match a real org's setup
   in one place. **Do you already have a Zoho CRM sandbox/dev account with
   API console access (to generate the Self Client refresh token), or should
   the seed script assume a fresh trial org with default modules?**
3. **Session persistence:** survives page refresh via `localStorage`
   (above) — default, easy to change to "always fresh session."
4. **Booking ID / registration number formats:** treated as free-text
   strings, validated only for "non-empty," no format/checksum assumed
   (e.g. no assumption about Indian registration plate format). Flag if you
   want format validation.
5. **UI styling:** minimal/neutral (system font stack, no Tailwind/UI
   library unless you want one) — functional over branded, since styling
   isn't a rubric criterion per the brief. Say if you want it Mahindra-branded
   or want a specific CSS approach.

## 11. Folder structure

See `PROGRESS.md`'s companion tree in the approval message / repo root
listing below (kept in sync as the canonical structure once scaffolding
starts in Phase 1.2).

## 12. Booking stage — deviation from the brief's literal wording

The brief names `"Closed Won - Booking Done"` as the Deal stage that
signals a completed booking. That was the original implementation
(`BOOKING_STAGE` in `backend/src/types/zoho.ts`), but it requires manually
adding a brand-new value to the Deals module's Stage picklist in Zoho
Setup (with its own Probability %, and care not to disrupt existing
pipeline reporting) before the CRM will even accept it. During Phase 6
live testing, the seed script's write of that value was silently dropped
by Zoho (no error — a fresh org just doesn't recognize an unconfigured
picklist value) and the record fell back to the standard `"Closed Won"`
stage, which made every booking lookup fail.

`BOOKING_STAGE` now matches on the standard `"Closed Won"` stage instead
— every Zoho org has this by default, zero configuration required. The
trade-off: any Deal marked `Closed Won` for a reason unrelated to a
vehicle booking would now also match `search_booking`. Not a concern for
this project's scope (a demo CRM with 2 seeded Deals), but worth knowing
if this were extended toward production — the fix there would be
requiring `Booking_Id` to also be non-empty as a second condition, rather
than reverting to the custom-stage approach.
