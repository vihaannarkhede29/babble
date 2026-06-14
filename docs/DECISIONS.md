# Babble — Decisions & Assumptions Log

Why Babble is built the way it is. Each entry: the call we made, why we made it, and the trade-off or assumption we accepted. Written for judges and anyone reading the code cold.

---

## 1. Web Speech API is the grader; the DSP engine powers visuals + offline fallback

**Decision.** The verdict for every spoken attempt — in both the Coach and the diagnostic — comes from the browser's Web Speech API (SpeechRecognition), which transcribes speech to text. `matchWord()` then scores that transcript against the target with Levenshtein fuzzy string similarity on a 0–100 scale (an exact word or accepted homophone = 100). The hand-rolled DSP engine (LPC formant estimation, FFT, Gaussian formant-distance scoring) is reserved for the live "interference wave" visualization (WaveCanvas) and for MicCoach, an offline fallback grader used when a browser lacks Web Speech (e.g. Firefox).

**Why.** Web Speech recognition is robust on the messy, high-pitched, half-formed speech of 3–8-year-olds in a way a from-scratch formant matcher is not. Letting it own the verdict keeps grading reliable across real kids' voices, while the DSP work still earns its keep on screen and as a graceful degradation path.

**Trade-off / assumption.** Grading is a string-similarity scalar, not an acoustic measurement, and we say so plainly. There is **no cosine similarity** anywhere in Babble — we refuse to advertise a metric we don't compute. We assume the target browser ships Web Speech; where it doesn't, MicCoach takes over.

---

## 2. Honest word-level phoneme inference, not fabricated per-phoneme confidence

**Decision.** The Teach Blaze diagnostic infers each sound's status at the word level (`src/diagnostic/inference.ts`): a sound is **clear** if at least one whole screener word containing it was said correctly, **practise** if every word testing it was missed, and **untested** otherwise. We never emit a per-phoneme number like "/ʃ/ = 73%".

**Why.** The Web Speech API returns word-level transcripts only — it exposes no per-phoneme confidence. Manufacturing a precise-looking phoneme score would be inventing data we don't have. Word-level inference is honest about exactly what the signal can support.

**Trade-off / assumption.** Coarser granularity than a clinical instrument, by design. The diagnostic is labelled an early, playful screener — **not a clinical diagnosis** — both in the product and in the parent report. We assume that one correct word containing a sound is reasonable evidence the child can produce it.

---

## 3. No seeded or fake stats — every data point is a real rep

**Decision.** Babble ships with zero fabricated progress data. XP, levels, and every chart are driven only by reps the child actually performs; both the Coach and the diagnostic feed the game store (`src/game/store.ts`). Screens show an empty state until the first real attempt, then fill live as the child speaks. `adaptiveSeries()` auto-zooms its time axis to the data span: by **hour** on day one, then **days**, **months**, and **years** as history accumulates.

**Why.** A demo seeded with fake mastery curves would misrepresent what the product measures. Showing only real reps means everything on screen is something the child genuinely said — credible to a parent and honest to a judge.

**Trade-off / assumption.** A first-run dashboard looks empty until someone speaks; we treat that honest emptiness as a feature, not a gap to paper over with seed data.

---

## 4. Plain CSS + external-store state, not Tailwind / Framer / Redux

**Decision.** Styling is plain CSS with CSS variables and the Nunito font. State lives in a small `useSyncExternalStore` external-store pattern backed by localStorage. No Tailwind, no Framer Motion, no Redux or Zustand.

**Why.** A hackathon PWA that must be offline-first and install cleanly from a clean clone benefits from the smallest possible dependency surface. Hand-rolled CSS and a native React store keep the bundle lean, the build fast, and behaviour fully under our control — including the CSS-animated dragons and canvas confetti.

**Trade-off / assumption.** More hand-written code than a utility framework or animation library would require, and no third-party state ergonomics. We accept that cost for zero extra runtime dependencies and predictable offline behaviour.

---

## 5. Rebrand PhonicsForge → Babble, with all storage unified under `babble.*`

**Decision.** The product formerly called PhonicsForge is now **Babble** everywhere — UI, copy, and code. All localStorage keys live under a single `babble.*` namespace: `babble.game.v2`, `babble.profile.v1`, `babble.diagnostic.v1`, `babble.customwords.v1`, `babble.calibration.v1`, `babble.dict.v1`.

**Why.** "Babble" fits a product for pre-readers far better than the old name. Unifying every key under one namespace keeps stored state coherent, easy to reason about, and trivial to clear or inspect as a group.

**Trade-off / assumption.** We assume no need to migrate data from old, differently-named keys — clean-clone, on-device usage means there is no legacy store to carry forward.

---

## 6. 40 words across 8 catalogued focus sounds, many words per sound

**Decision.** The word database holds 40 illustrated words spanning 8 focus sounds — six vowels (/iː ɛ æ ɑː oʊ uː/) plus the /s/ and /ʃ/ sibilants — with multiple words per sound. `src/speech/wordSchedule.ts` rotates them through a deterministic Today / Tomorrow / This-week schedule, and the child's own typed words (rule-based g2p breakdown) surface first in Today.

**Why.** Multiple words per sound give variety so practice doesn't feel repetitive, while a small, deliberately catalogued set of sounds keeps the mastery-by-sound charts coherent and readable rather than scattering thin data across dozens of categories.

**Trade-off / assumption.** Coverage is intentionally bounded — eight sounds, not the full phonetic inventory. We assume focused, legible mastery charts serve a young child and watching parent better than exhaustive but sparse coverage.

---

## 7. Dictionary enrichment is optional, cached, and never gates the offline core

**Decision.** The dictionary layer (`src/speech/dictionary.ts` + `components/WordInfo.tsx`) pulls real IPA, a kid-friendly definition, and a 🔊 pronunciation clip from the free, key-less, CORS-open Free Dictionary API (api.dictionaryapi.dev). Results are cached to localStorage, so the feature works offline and instantly after the first fetch. The obscure "deep cut" definition is hidden by default and revealed **only** when a curious user pries via double-click / long-press.

**Why.** Real phonetics and definitions enrich a word without us hand-authoring a dictionary. Caching makes the enrichment offline-friendly; gating the obscure definition behind a deliberate gesture keeps the default view kid-appropriate while rewarding curiosity.

**Trade-off / assumption.** This is the only network call in the entire product, and it is strictly optional — the core grader never depends on it. We accept a one-time online fetch per word (then cache) in exchange for authentic phonetics, and assume the public API is reachable on first lookup; if not, the offline core is unaffected.

---

## 8. A parent PIN gates the grown-up areas

**Decision.** A 4-digit parent PIN, set optionally during onboarding, sits in front of the grown-up surfaces: the diagnostic report, the Progress dashboard, and Settings (`components/ParentGate`).

**Why.** Progress data, the parent report, and settings are for the adult, not the child mid-play. A lightweight PIN keeps a young child from wandering into report exports or changing configuration, without imposing accounts or a backend.

**Trade-off / assumption.** A 4-digit PIN is a soft, child-proofing gate, not real security — appropriate for a no-accounts, on-device product. We assume the PIN is optional by design and that on-device data needs deterrence, not cryptographic protection.
