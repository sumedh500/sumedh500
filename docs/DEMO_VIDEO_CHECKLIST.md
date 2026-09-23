# Demo Video Checklist (5–7 minutes)

## Before you hit record

- [ ] Backend running (`cd backend && npm run dev`), terminal window visible
      and readable at your recording resolution — you'll cut to it to show
      the stage classifier / tool-call logs live.
- [ ] Frontend running (`cd frontend && npm run dev`), browser window sized
      so both the chat and (in a second tab/window) Zoho CRM are easy to
      switch between.
- [ ] A second browser tab already logged into Zoho CRM, sitting on the
      **Leads** list view (you'll navigate to Deals/Cases later, but
      starting here avoids a login delay on camera).
- [ ] Fresh browser session for the chat — clear `localStorage` or use a
      private window, so the stage classifier isn't influenced by any
      leftover test conversation.
- [ ] Re-run `npm run seed:zoho` if your seeded Deals/Contacts have been
      edited or deleted since — you want clean, known starting data.
- [ ] Know your seeded test values ahead of time (from the seed script's
      printed output): pipeline phone, booking phone, Booking ID.
- [ ] Decide your screen layout: chat window + browser tab you'll alt-tab
      to, or a split screen with chat on one side and Zoho on the other
      (split screen is stronger for the "real-time CRM update" moments —
      the viewer sees the record change without a cut).

## Script (target ~6 minutes)

### 1. Intro — 20s
- State the project in one sentence: a multistage AI chat agent for an
  automotive OEM, four customer lifecycle stages, backed by Zoho CRM,
  using Groq's native tool calling (no LangChain).
- One sentence on the stack: React/TS frontend, Express/TS backend, Redis
  sessions, direct Groq SDK calls.

### 2. Architecture, 30s
- Show `docs/architecture-diagram.svg` (or `ARCHITECTURE.md`).
- Say the one thing worth remembering: **every chat turn is two Groq
  calls** — a cheap classifier that picks the lifecycle stage, then a
  tool-calling loop that only sees that stage's tools. That's what keeps
  tool routing accurate instead of throwing all the tools at the model
  every time.

### 3. New Lead — ~70s
- Switch to the chat. Type: *"Hi, I'm interested in the XUV700"*
- Let it ask for name/phone/email/city — answer live (don't pre-script
  every word, a natural back-and-forth sells it better than a scripted
  read).
- Once `create_lead` fires, **cut/switch to the Zoho Leads tab and refresh**
  — show the new Lead record appearing with the vehicle model field
  populated. This is your first "real-time CRM update" beat.

### 4. Ongoing Pipeline — ~50s
- Fresh-ish turn (new session, or clearly pivot): *"What's the status of
  my quotation, phone `<pipeline phone>`?"*
- Show the reply (stage + follow-up preference).
- Say: *"let's update my follow-up to a phone call"* → `update_deal_followup`
  fires.
- Switch to Zoho, open that Deal record, refresh, show
  `Follow_Up_Preference` has actually changed — second real-time update
  beat, and it's an **update**, not just a create, which is worth calling
  out explicitly on camera.

### 5. Booked Vehicle — ~50s
- New session. *"What's the delivery status for phone `<booking phone>`?"*
- Show it return allocation stage, VIN, payment link.
- Optionally show the Deal record in Zoho side-by-side to prove the VIN/
  allocation values match exactly what's in the CRM, not invented.

### 6. Post-Purchase / Service — ~60s
- New session. *"I need to book a service, my number is `<either phone>`"*
- Answer the follow-ups (registration number, odometer, issue type,
  service center) live.
- Once `create_case` fires, switch to Zoho **Cases**, refresh, show the new
  Case linked to the right Contact — third and final real-time update beat.

### 7. Under the hood — 30–40s
- Cut to the backend terminal for a few seconds during (or right after)
  one of the above turns. Point at:
  - the `[stage-classifier]` log line showing the routing decision
  - the Zoho request/response logs (Contact found, Deal stage, etc.)
- This is the moment that actually demonstrates "accuracy in tool
  routing" instead of just asserting it — the terminal is the proof.

### 8. Wrap-up — 15s
- One sentence: all four stages, real Zoho reads/writes, no framework
  abstraction over the tool-calling loop. Point to the repo/README for
  setup.

## Things that will look bad on camera if you skip them

- **Don't reuse one long session across all 4 stages** — the sticky stage
  classifier means a stale session can answer from old context instead of
  actually re-routing. Fresh session per stage reads cleaner anyway.
- **Refresh the Zoho tab after every action** — Zoho's UI doesn't
  auto-refresh; an unrefreshed page makes a real update look like nothing
  happened.
- **Don't let dead air sit during a Groq call** — if latency is
  noticeable, either narrate over it ("it's calling out to Groq now,
  classifying the stage...") or trim it in editing.
- **Have your seeded phone numbers/Booking ID written down somewhere
  visible off-camera** — fumbling to remember `+919820055667` mid-recording
  is exactly the kind of thing a second take avoids.
