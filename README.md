# 🐉 Babble

Real-time, in-browser speech coaching for pre-readers (~ages 3–8). Teach a baby dragon to talk, and it teaches your kid to talk back.

Babble is an **offline-first PWA** with **no backend, no accounts, and 100% on-device** processing. Built for **Milpitas Hacks 2** (Track 1: Interactive Learning). Formerly "PhonicsForge."

---

## What it is

A kid speaks a word into the mic. Babble listens, scores the attempt on a clean 0–100 scale, and turns every rep into XP for a dragon companion. Underneath the play is an honest early phoneme screener and a real, live-updating progress dashboard a parent (or speech-language pathologist) can actually read.

---

## Headline features

- **The Coach — speak a word, see a real score.** After each attempt a clean score card shows the **0–100 %**, the **recognized word**, and a **"match score"** caption. No black box: the number you see is the number that was computed.
- **Teach Blaze — a diagnostic disguised as play.** A ~27-word screener framed as teaching a just-hatched dragon (Blaze) to talk. A Blaze energy bar fills as words are said; the kid gets canvas confetti + a star rating at the end. Honest per-phoneme inference, not fabricated confidence numbers (see below).
- **Real XP and levels.** No fabricated seed data — XP is earned **only from real reps**. Both the Coach and the diagnostic feed the game store. A gentle sqrt level curve; level-ups fire confetti.
- **Live adaptive progress dashboard.** Plots **only what the child actually said**, updating live. The time axis auto-zooms from **HOUR → DAYS → MONTHS → YEARS** as history grows. Before→after session accuracy delta, mastery-by-sound bars, and a "ready-for-therapy" SLP summary table + CSV.
- **40-word scheduler + add-your-own-word.** 40 illustrated words across 8 focus sounds (vowels /iː ɛ æ ɑː oʊ uː/ plus the /s/ and /ʃ/ sibilants). A deterministic **Today / Tomorrow / This-week** rotation; the child's own typed words (rule-based g2p breakdown) surface first in Today. Home shows a daily-goal progress ring that completes.
- **Dictionary enrichment (with a hidden deep cut).** An **optional** online layer using the free, key-less, CORS-open Free Dictionary API shows the real IPA phonetic, a kid-friendly definition, and a 🔊 pronunciation clip — all cached to localStorage so it works offline after the first fetch. A hidden "deep cut" obscure definition is revealed **only** when a curious user pries (double-click / long-press) — never shown by default.
- **Offline-first PWA.** Installable, service-worker precached, runs with no network.
- **Parent PIN gate.** An optional 4-digit PIN sits in front of Progress, Settings, and the diagnostic report.

---

## How grading works (honestly)

We're deliberate about what's real here:

- **The verdict comes from Web Speech + fuzzy word-match.** The primary grader — for **both** the Coach and the diagnostic — is the browser **Web Speech API** (`SpeechRecognition`). It transcribes the spoken word to text, then `matchWord()` scores it with **Levenshtein fuzzy string similarity → 0–100** (exact word / accepted homophone = 100). This is a string-similarity scalar, **not** acoustic.
- **The DSP engine powers visuals and an offline fallback.** The hand-rolled DSP code (`src/audio/`: LPC formant estimation, FFT, Gaussian formant-distance scoring) drives **(a)** the live "interference wave" visualization (`WaveCanvas`) and **(b)** `MicCoach`, an **offline fallback grader** for browsers without the Web Speech API (e.g. Firefox).
- **No per-phoneme fabrication.** The Web Speech API gives **word-level transcripts only** — no per-phoneme confidence — so we never invent a "/ʃ/ = 73%" number. A sound is **"clear"** if at least one whole screener word containing it was said correctly, **"practise"** if every word testing it missed, else **"untested."**
- **There is no cosine similarity anywhere.** We don't claim it.

> One-liner: Web Speech recognition + fuzzy word-match for the verdict; a hand-rolled formant/DSP engine powers the live visualization and an offline fallback grader.

The parent report is explicit: this is **a playful early screener, NOT a clinical diagnosis.**

---

## Quick start

Requires **Node 18+**. Runs from a clean clone — no secrets, no env vars.

```bash
npm install
npm run dev
```

Or build and preview the production PWA:

```bash
npm run build
npm run preview
```

---

## Demo script (~60–90s)

1. **Onboard (≈15s).** First run gates you into `/onboarding`: meet Blaze → name the child + dragon and set age → pick tricky sounds + session length → optionally set a 4-digit parent PIN. Profile persists to localStorage.
2. **Teach Blaze (≈25s).** Hit the diagnostic intro, then run the screener: say the ~27 coverage words one at a time. Watch the Blaze energy bar fill; finish to confetti + a star rating.
3. **See the report (≈15s).** Enter the parent PIN to open the report: a phoneme grid, top sounds to work on with concrete mouth cues, and print-to-PDF / CSV / email export — with the "early screener, not a diagnosis" note.
4. **Practise a word (≈15s).** Go to the Coach, speak a scheduled word, and get the score card: 0–100 %, the recognized word, and the match-score caption. The live interference wave reacts as you speak.
5. **Watch the dashboard fill (≈15s).** Open the PIN-gated dashboard. Every rep you just did is plotted live — accuracy delta, mastery-by-sound bars, the auto-zooming time axis, and the SLP summary table. Nothing seeded; all earned.

---

## Privacy

Everything is on-device. **No audio or video ever leaves the browser** (webcam is opt-in; clips are in-memory object URLs, gone on reload). The **only** network call is the optional dictionary lookup — a word string to a public API — and it is cached.

All persistence lives under the `babble.*` localStorage namespace: `babble.game.v2`, `babble.profile.v1`, `babble.diagnostic.v1`, `babble.customwords.v1`, `babble.calibration.v1`, `babble.dict.v1`.

---

## Stack

Vite 5 + React 18 + TypeScript (strict, `noUnusedLocals`). Plain CSS with CSS variables + Nunito font (no Tailwind, no Framer Motion, no Redux/Zustand). `react-router-dom` v6, `recharts` 2, `vite-plugin-pwa`. State via React `useSyncExternalStore` external-store pattern + localStorage.

**Routing** (`src/App.tsx`, `BrowserRouter`): a first-run gate funnels new users to `/onboarding` until a profile exists.

| Route | Purpose |
|---|---|
| `/onboarding` | 4-step setup (full-screen) |
| `/` | Home hub |
| `/practice`, `/practice/:wordId` | The Coach |
| `/teach-blaze` | Diagnostic intro (full-screen) |
| `/diagnostic` | The screener run (full-screen) |
| `/diagnostic/report` | PIN-gated parent report |
| `/dashboard` | PIN-gated progress |
| `/settings` | PIN-gated settings |

Onboarding / teach-blaze / diagnostic render full-screen (no header); the rest wear a branded header with a live XP/level bar.

---

## File map

```
src/
├── App.tsx                 router + first-run gate
├── components/
│   ├── AppHeader           branded header w/ live XP/level bar
│   ├── Blaze               the dragon the child teaches (CSS-animated SVG, 6 states)
│   ├── Dragon (Sparky)     the Coach's helper companion (mic-driven mouth)
│   ├── WordPractice        the Coach
│   ├── WordInfo            dictionary enrichment UI
│   ├── Dashboard           live adaptive progress
│   ├── WaveCanvas          live interference-wave visualization
│   ├── ArticulationFace    mouth-cue visual
│   ├── MicCoach            offline fallback grader
│   ├── ReplayClip          in-memory attempt replay
│   ├── Confetti            hand-rolled canvas confetti
│   ├── StarRating          end-of-run stars
│   └── ParentGate          4-digit PIN gate
├── pages/
│   ├── Home                hub + daily-goal ring
│   ├── Onboarding          4-step setup
│   ├── PracticeRoute       Coach route
│   ├── ProgressRoute       dashboard route
│   ├── Settings            PIN-gated settings
│   ├── TeachBlazeIntro     diagnostic intro
│   ├── Diagnostic          screener run
│   └── DiagnosticReport    PIN-gated parent report
├── speech/
│   ├── words               40-word database
│   ├── wordSchedule        Today / Tomorrow / This-week rotation
│   ├── match               matchWord() Levenshtein fuzzy scoring
│   ├── useSpeechRecognition  Web Speech API hook
│   ├── useAttemptRecorder  attempt capture
│   ├── articulation        articulation data
│   ├── g2p                 rule-based grapheme→phoneme
│   ├── customWords         add-your-own-word store
│   ├── phonemeTokens       phoneme tokenization
│   └── dictionary          Free Dictionary API + cache
├── diagnostic/
│   ├── diagnosticWords     ~27-word coverage bank
│   ├── inference           honest per-phoneme inference
│   └── store               diagnostic state
├── profile/
│   ├── profile             profile model
│   └── store               profile store
├── game/
│   ├── store               XP/levels + adaptiveSeries()
│   └── dragon              dragon game state
├── audio/
│   ├── dsp                 LPC formants, FFT
│   ├── scorer              Gaussian formant-distance scoring
│   ├── phonemes            phoneme reference data
│   └── calibration         mic calibration
└── lib/
    ├── types               shared types
    ├── colors              palette
    └── session             session helpers
```
