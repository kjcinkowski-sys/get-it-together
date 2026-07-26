# Future enhancements

A running list of ideas for where the app goes next, with honest notes on effort and
the parts of the codebase each one touches. This is a thinking/planning doc, not a
committed roadmap — nothing here is scheduled until it's pulled into an actual plan.

Roughly ordered by suggested sequencing (see the bottom of the file for the rationale).

---

## 1. Extract a nav shell (sidebar instead of the top ribbon)

**Effort: easy — but there's a prerequisite.**

There is currently no shared nav component. Every page (`dashboard`, `stats`,
`profile`, and the two forms) hand-rolls its own `<header class="app-header">` with the
links duplicated inline. That duplication is why adding pages makes the top bar feel
cluttered — each new destination has to be pasted into each header.

The real win is to **extract a single nav/shell component** (it can live in
`app.component.html`, which today is just splash + `<router-outlet>`) and route
everything through it. Once nav is centralized, top-bar vs. sidebar becomes a CSS
decision that can be flipped freely. Do the extraction first; the sidebar falls out for
free.

**Caution:** on mobile a persistent sidebar eats horizontal space — plan for a
collapsible drawer, not a fixed rail.

---

## 2. New-user onboarding / tutorial

**Effort: easy-to-medium. Highest ROI item relative to effort.**

There's no onboarding today, and an identity-based tracker genuinely needs it — the core
concept ("habits hang off an identity statement") is not self-evident. A new user landing
on an empty dashboard with a companion they don't understand is arguably the biggest
current gap in the app.

Simplest version: a guided first-run flow (pick an identity → pick a companion → add one
habit → check in) that teaches the mental model, gated on a `hasOnboarded`-style profile
flag. Client-side coach-marks / step flow; no heavy infra required.

Note the synergy with the AI feature (#6): both are really about the "tell me who you
want to be" moment. Consider designing them together.

---

## 3. Multi-day view toggle (see more than just today)

**Effort: medium. Half of it already exists.**

Check-in already passes an explicit date (`checkIn(habitId, this.today, status)`) and
logs are stored per-date, so the write path is already date-flexible. What's hardcoded is
the **read/dashboard** side: the component computes `today` and the endpoint is literally
`/api/dashboard/today`, pinned to `DateTime.UtcNow`. The work is parameterizing that
endpoint by date and adding date navigation in the UI.

**Decisions to make:**
- Back-dating rule: can users log yesterday? Future dates?
- Retroactive edits change streaks and therefore companion growth — users will notice.
- There's an existing UTC-vs-local-midnight subtlety in `todayIso()` that gets more
  exposed once dates are user-selectable.

---

## 4. More companions (from hand-drawn artwork)

**Effort: very doable — the codebase is well set up for it.**

Companions live in `frontend/src/app/shared/companion/companion-art.ts` as pure
SVG-string functions returning 5 growth stages (0–4), plus a `CompanionType` enum on the
backend and a `COMPANION_OPTIONS` list on the frontend. Adding one is a clean, additive
change: new enum value → new stage-art function → new picker option. No migration risk to
existing identities (they default to the legacy `Sprite`).

Turning drawings into companions is feasible. Ideally provide one drawing per growth
stage (or just start + fully-grown, and interpolate the middle).

**Decision to make up front — before investing hours drawing:**
- **(a) Stylize** the drawings into the existing flat-vector language (keeps the app
  cohesive, hand-authored SVG).
- **(b) Embed** the actual artwork as raster/exported-SVG assets (looks exactly like the
  drawings, but breaks from the current all-code approach).

Faithfully reproducing detailed/painterly art as hand-authored SVG paths is slow and
lossy, so pick the approach before the art is finalized.

---

## 5. Bad habits ("break a bad habit")

**Effort: looks small, isn't. Scope as its own project.**

The UI part is trivial (swap button labels to something like *Slipped / Held / Clean*).
The depth is in the growth engine, which assumes positive framing throughout:

- `GrowthCalculator` grows the companion from the **best current streak of completions**.
- `StreakCalculator` treats "today is pending, not a miss" — correct for good habits, but
  **inverts for bad ones**, where a day with no log is arguably a *success* (you didn't do
  the thing) rather than pending.

So a bad habit needs a **polarity concept** on the `Habit` model, and the streak/growth
math has to branch on it: for a "breaking" habit, the streak counts consecutive *avoided*
days, and a missing log should probably count as success-so-far rather than pending. That
is a real semantic fork through the two most important service classes, plus a migration.

Worth doing — it roughly doubles the app's scope in a good way — but it's a project, not
an afternoon.

**Framing note:** for bad habits, users think in terms of *resisting*. "Clean streak"
framing tends to land better than generic "step forward / step back" labels.

---

## 6. AI habit suggestions

**Effort: mechanically feasible; the real cost is operational.**

Mechanically: a new backend endpoint that calls an LLM ("here's who I want to be →
suggest 3 habits") plus a small chat UI to refine them.

The catch is that it introduces an API key, per-call cost, latency, rate limits, a
prompt-injection surface, and a "what if it's down" failure mode — none of which the
current self-contained stack has.

**Guidance:**
- Make it a value-add, not a dependency. The app must stay fully usable if the AI never
  responds.
- The AI suggestion flow and the onboarding tutorial (#2) are the same moment ("tell me
  who you want to be") — design them together rather than as two separate features.

---

## Suggested sequencing & rationale

1. **Extract the nav shell** — unblocks the sidebar *and* pays down the duplicated-header
   debt.
2. **Onboarding tutorial** — highest ROI, teaches the core concept, low infra.
3. **Multi-day toggle** — half-built already; needed before the app feels "real".
4. **New companions** — parallelizable; gated on artwork, not on code.
5. **Bad habits** — its own project; touches the growth engine.
6. **AI suggestions** — last; fold into onboarding, keep it optional.

The through-line for #2, #3, and #6: they're all really about the **first session**.
Fixing what a brand-new user experiences is a bigger lever than any single feature.
