# Architecture — Babble

Babble is real-time, in-browser speech coaching for pre-readers (ages ~3–8). This document explains the shape of the system: why it is a 100%-client-side PWA, how an attempt flows from the microphone to the dashboard, how the dual grading engine works (and what it honestly does *not* do), how the diagnostic infers per-phoneme results from word-level data, and how state is partitioned across `localStorage`.

---

## 1. System shape: a 100%-client-side PWA

There is **no backend, no database server, no accounts, and no runtime network dependency.** Microphone capture, recognition, DSP, scoring, game state, the diagnostic screener, and the dashboard all run on-device in the browser.

This is a deliberate product constraint, not an accident of the hackathon clock:

- **Privacy by construction.** No audio or video ever leaves the browser. The optional webcam is opt-in and its clips are in-memory object URLs that vanish on reload. Nothing to leak because nothing is sent.
- **Offline-first.** Packaged with `vite-plugin-pwa`, Babble is installable and precaches its assets via a service worker, so a clean install keeps working on a flaky connection or none at all.
- **Zero-config from a clean clone.** No secrets, no env vars. `npm install` then `npm run dev` (or `npm run build` + `npm run preview`). Node 18+.

The **only** network call in the entire app is the optional dictionary enrichment lookup (§8) — a single word string to a public API — and even that is cached to `localStorage` so it works offline after first fetch. The core grader never touches the network.

---

## 2. Stack and the "no-framework-tax" choices

| Layer | Choice |
|------|--------|
| Build | **Vite 5** |
| UI | **React 18** + **TypeScript** (strict, `noUnusedLocals`) |
| Routing | **react-router-dom v6** (`BrowserRouter`) |
| Charts | **recharts 2** |
| PWA | **vite-plugin-pwa** (installable, service-worker precache) |
| Styling | **Plain CSS** with CSS variables + the **Nunito** font |
| State | **React `useSyncExternalStore`** external-store pattern + `localStorage` |

The deliberate omissions are the point:

- **No Tailwind.** Plain CSS with CSS variables keeps the bundle lean, theming central, and the styling layer trivial to read in code review — no utility dialect to learn.
- **No Redux / Zustand.** App state is small and naturally partitioned by concern (game, profile, diagnostic, dictionary). Each concern owns a tiny external store that React reads through `useSyncExternalStore`. This gives tear-free reads and live updates without a state-management dependency.
- **No Framer Motion.** Animation is hand-rolled — CSS keyframe animation for Blaze's states, canvas for confetti and the live waveform. Nothing in the dependency list that we don't need.

TypeScript is strict end-to-end with `noUnusedLocals`, so dead code and loose typing fail the build rather than rotting silently.

---

## 3. Routing, the first-run gate, and the two layouts

Routing lives in `src/App.tsx` under `BrowserRouter`. A **first-run gate** funnels any new user into onboarding until a profile exists in `localStorage`; once a profile is present, the gate steps aside and the hub becomes the home.

| Route | Screen |
|------|--------|
| `/onboarding` | 4-step onboarding |
| `/` | Home hub |
| `/practice`, `/practice/:wordId` | The Coach |
| `/teach-blaze` | Diagnostic intro |
| `/diagnostic` | The screener run |
| `/diagnostic/report` | PIN-gated parent report |
| `/dashboard` | PIN-gated progress |
| `/settings` | PIN-gated settings |

Two layout modes:

- **Immersive (full-screen, no header):** `/onboarding`, `/teach-blaze`, `/diagnostic`. These are focused, kid-facing flows where chrome would distract.
- **Branded header:** every other route wears `AppHeader` with a live XP/level bar, so the child's progress is always visible while practicing.

A **parent PIN gate** (`ParentGate`) sits in front of the three "grown-up" surfaces — Progress, Settings, and the diagnostic report.

---

## 4. The data flow of one attempt

This is the spine of the app. A single Coach attempt flows left to right and ends as durable, charted progress:

```
  🎤 mic
   │  getUserMedia
   ▼
[ useSpeechRecognition ]      Web Speech API (SpeechRecognition)
   │  word transcript (text)         transcribes spoken word → text
   ▼
[ match.ts → matchWord() ]    Levenshtein fuzzy STRING similarity → 0–100
   │  score 0–100 + recognized word   (exact word / accepted homophone = 100)
   ▼
[ useAttemptRecorder ]        packages the rep
   │  score card: %, recognized word, "match score" caption
   ▼
[ game/store.ts ]            records the attempt, awards REAL XP, maybe level-up
   │  useSyncExternalStore + babble.game.v2
   ▼
[ Dashboard ]               recomputes adaptive series live from real reps
```

Concretely:

1. **Capture + recognize.** `useSpeechRecognition` runs the browser's Web Speech API and yields a **word-level text transcript** of what the child said.
2. **Grade.** `matchWord()` in `src/speech/match.ts` scores that transcript against the target word using **Levenshtein fuzzy string similarity**, producing a **0–100** scalar. An exact word or an accepted homophone is **100**.
3. **Show the verdict.** After each attempt a clean score card shows the 0–100 %, the recognized word, and a "match score" caption.
4. **Persist + reward.** `useAttemptRecorder` hands the rep to `game/store.ts`, which records it and awards **real XP** — no fabricated seed data; XP is earned only from real reps. Both the Coach and the diagnostic feed this same store. A gentle `sqrt` level curve governs levels; a level-up fires confetti.
5. **Chart.** The Dashboard subscribes to the store and recomputes its adaptive series live (§7).

The same WaveCanvas runs the live "interference wave" visualization off the DSP engine (§5) during capture, but it is purely visual — it does not produce the verdict.

---

## 5. The dual engine — and what it is *not*

Babble has two independent audio paths. Being precise about which one grades is the most important honesty in this codebase.

### 5a. Primary grader — Web Speech + fuzzy word match

The **Coach and the diagnostic both** grade through the path in §4: the Web Speech API (`SpeechRecognition`) transcribes the spoken word to **text**, and `matchWord()` scores that text with **Levenshtein fuzzy string similarity** to a **0–100** scalar. This is a **string-similarity** verdict over a recognized word. It is **not acoustic** and it is **not cosine similarity** — there is no cosine similarity anywhere in Babble. Do not claim otherwise.

### 5b. DSP engine — visualization and offline fallback only

The hand-rolled DSP engine in `src/audio/` (LPC formant estimation, FFT, Gaussian formant-distance scoring) serves two roles, **neither of which is the primary verdict**:

- **(a) The live "interference wave" visualization** rendered by `WaveCanvas`.
- **(b) `MicCoach`, an OFFLINE FALLBACK grader** used when a browser lacks the Web Speech API (e.g. Firefox). When the primary recognizer isn't available, MicCoach grades on-device with the formant/DSP engine so the child can still practice.

The honest one-liner for judges:

> **Web Speech recognition + fuzzy word-match for the verdict; a hand-rolled formant/DSP engine powers the live visualization and an offline fallback grader.**

---

## 6. The Teach Blaze diagnostic pipeline

The headline feature is a **disguised phoneme screener** framed as teaching a just-hatched dragon, **Blaze**, to talk.

**The run.** A ~27-word coverage bank (`src/diagnostic/diagnosticWords.ts`), **one attempt per word**, graded by the **real engine** (the §4 path — same Web Speech + `matchWord` grader the Coach uses). A Blaze energy bar fills as words are said. At the end, a kid celebration fires: hand-rolled canvas confetti (`Confetti`) plus a star rating (`StarRating`).

**Honest per-phoneme inference** (`src/diagnostic/inference.ts`). The Web Speech API gives **word-level transcripts only — no per-phoneme confidence.** So Babble **never fabricates** a number like "/ʃ/ = 73%". Instead, for each sound it applies a defensible rule:

- **clear** — at least one whole screener word containing that sound was said correctly.
- **practise** — every screener word testing that sound was missed.
- **untested** — no screener word covered it.

These resolve into **priority / mastered / avoid** phoneme lists written to the profile (`babble.profile.v1`), and the run state is persisted via the diagnostic store (`babble.diagnostic.v1`).

**PIN-gated parent report** (`/diagnostic/report`, `DiagnosticReport`): a phoneme grid, the top sounds to work on with **concrete mouth cues**, and export via **print-to-PDF / CSV / email**. It carries an explicit note that this is a **playful early screener, NOT a clinical diagnosis.**

---

## 7. State and persistence: separate stores by concern

State is partitioned. Each concern owns one tiny external store exposed to React through `useSyncExternalStore`, and each persists to its own namespaced `localStorage` key under `babble.*`. No global store, no cross-concern coupling.

| `localStorage` key | Owner module | Holds |
|--------------------|--------------|-------|
| `babble.game.v2` | `src/game/store.ts` | Real XP, levels, and the attempt history that feeds the dashboard |
| `babble.profile.v1` | `src/profile/store.ts` (`src/profile/profile.ts`) | Child + dragon names, age, session length, PIN, and the diagnostic's priority/mastered/avoid sound lists |
| `babble.diagnostic.v1` | `src/diagnostic/store.ts` | Diagnostic run state and results |
| `babble.customwords.v1` | `src/speech/customWords.ts` | The child's own "add your own word" entries (rule-based g2p breakdown) |
| `babble.calibration.v1` | `src/audio/calibration.ts` | DSP/mic calibration data |
| `babble.dict.v1` | `src/speech/dictionary.ts` | Cached dictionary enrichment results (§8) |

Because XP is sourced only from real reps fed into `babble.game.v2`, the dashboard's **empty state until the first rep** is genuine — there is no seed history.

---

## 8. Adaptive time-series design (hour → day → month → year)

The Dashboard (`Dashboard.tsx`, driven by selectors in `src/game/store.ts`) plots **only what the child actually said**, updating live.

The core trick is `adaptiveSeries()`, which **auto-zooms its time axis to the data span**:

```
day one          →  by HOUR
days of history  →  by DAY
weeks/months     →  by MONTHS
long history     →  by YEARS
```

So on a child's first session the chart is legible at the **hour** grain, and as real history accumulates the axis widens to **days → months → years** without any manual configuration. The dashboard also shows a **before→after session accuracy delta**, **mastery-by-sound bars**, and a **"ready-for-therapy" SLP summary table + CSV** export.

On the Home hub, a **daily-goal progress ring** tracks the day's reps and completes with "Daily goal complete! 🎉".

---

## 9. Words, scheduling, and companions

**Word database.** 40 illustrated words (`src/speech/words.ts`) spanning **8 focus sounds** — six vowels /iː ɛ æ ɑː oʊ uː/ plus the /s/ and /ʃ/ sibilants — with many words per sound for variety while keeping the mastery charts coherent.

**Scheduler.** `src/speech/wordSchedule.ts` produces a deterministic **Today / Tomorrow / This-week** rotation. The child's own typed words (added via `customWords.ts`, broken down by rule-based g2p in `g2p.ts`) **surface first in Today.**

**Companions.** Two dragons:
- **Blaze** (`Blaze.tsx`) — the dragon the child *teaches*; a CSS-animated SVG with 6 states.
- **Sparky** (`Dragon.tsx`) — the Coach's helper companion with a mic-driven mouth.

---

## 10. Dictionary enrichment (optional, cached, the only network call)

The newest layer (`src/speech/dictionary.ts` + `components/WordInfo.tsx`) is an **optional online enrichment** using the free, key-less, CORS-open **Free Dictionary API** (`api.dictionaryapi.dev`).

For the current word it surfaces the real **IPA phonetic**, a **kid-friendly definition**, and a **🔊 pronunciation clip**. Results are **cached to `localStorage`** (`babble.dict.v1`), so after the first fetch it works offline and resolves instantly.

A hidden **"deep cut" obscure definition** is revealed **only** when a curious user pries it open (double-click / long-press) — never shown by default.

This is **pure enrichment.** The core grader never depends on the network; this is the single optional network call in the whole app, and it degrades to the cache when offline.

---

## 11. Module / data-flow diagram

```
                          ┌─────────────────────────────────────────┐
                          │           Browser / PWA  (on-device)     │
                          │      vite-plugin-pwa precache · offline  │
                          └─────────────────────────────────────────┘

   ┌──────────────┐   App.tsx (BrowserRouter + first-run gate)
   │ Onboarding   │──▶ profile? ──no──▶ /onboarding
   └──────────────┘                │
                                   yes
                                    ▼
        Immersive (no header):  /teach-blaze · /diagnostic
        Header + XP bar:        / (Home) · /practice · /dashboard · /settings(PIN)

   ─── attempt path ──────────────────────────────────────────────────────────
   🎤 mic ─▶ useSpeechRecognition ─▶ match.ts/matchWord() ─▶ useAttemptRecorder
   (Web Speech: word text)          (Levenshtein 0–100)           │
                                                                  ▼
                                                          game/store.ts
                                                  (real XP · level · attempts)
                                            useSyncExternalStore │ babble.game.v2
                                                                  ▼
                                                            Dashboard
                                                 adaptiveSeries(): hour→day→month→year

   ─── dual audio engine ─────────────────────────────────────────────────────
   src/audio/ (LPC · FFT · Gaussian formant-distance)
        ├─▶ WaveCanvas              (live "interference wave" visualization)
        └─▶ MicCoach                (OFFLINE FALLBACK grader, no Web Speech)
        ⚠ NOT the primary verdict · NOT cosine similarity

   ─── diagnostic ────────────────────────────────────────────────────────────
   diagnosticWords (~27, 1 attempt each) ─▶ real engine ─▶ inference.ts
        clear / practise / untested  ─▶  priority·mastered·avoid  ─▶ profile
        Confetti + StarRating · PIN-gated report (PDF/CSV/email)

   ─── stores (separate by concern, each owns its key) ───────────────────────
   game/store.ts ······· babble.game.v2          profile/store.ts ··· babble.profile.v1
   diagnostic/store.ts · babble.diagnostic.v1    customWords.ts ····· babble.customwords.v1
   audio/calibration.ts  babble.calibration.v1   dictionary.ts ······ babble.dict.v1

   ─── only network call ─────────────────────────────────────────────────────
   WordInfo ─▶ dictionary.ts ─▶ api.dictionaryapi.dev (optional) ─▶ cache(babble.dict.v1)
```

---

## 12. Privacy summary

Everything is on-device. **No audio or video ever leaves the browser.** The webcam is opt-in; its clips are in-memory object URLs that are gone on reload. The single network call is the **optional** dictionary lookup — a word string to a public API — and it is cached. There is no backend to send anything to.
