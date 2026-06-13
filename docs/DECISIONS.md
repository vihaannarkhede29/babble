# Decisions & Assumptions — PhonicsForge

Short bullets. Why each call was made, and where this build departs from the
original idea brief (and why that's the defensible choice).

## Rubric vs. brief conflicts (rubric wins, per instructions)

- **Brief assumed weighted criteria ("design to win the highest-weighted
  criteria"). The actual rubric has NO weights — 7 categories, each 1–10,
  equal.** → Strategy changed from "max out Technical for a 10/10" to **balanced
  excellence across all seven**, with special care for *Functionality* (judges
  use it live) and *Quality of Code* (which explicitly penalizes "blatantly AI
  generated" code).
- **Guidelines say "6 categories"; the rubric table lists 7** (Innovation,
  Technical, Functionality, Design, Impact, Relevance, Quality of Code). →
  Assumed **7** and targeted all of them. If the scoring form really has 6, we
  lose nothing by also nailing Quality of Code.
- **Brief's success thesis was "10/10 because the tech is sophisticated."** The
  rubric rewards *usable, well-presented, well-understood* work just as much. →
  We kept a genuinely sophisticated core (real LPC formant DSP) **but** made it
  bullet-proof to demo and easy to explain.

## Scope (single-day, ~10.5h build window from the schedule)

- The brief's full stack (wav2vec2 fine-tuned on CSLU Kids + Montreal Forced
  Aligner + Phi-3 via Ollama + Three.js blendshapes + Phaser) is **not buildable
  in a day and not runnable from a clean clone on a judge's laptop** (multi-GB
  models, GPU, native installs). → Built the **bare-minimum wedge** that proves
  the concept end-to-end and runs anywhere.
- Chose the **smallest set of sounds that demonstrates real discrimination**: 6
  vowels spanning the vowel space + the /s/–/ʃ/ sibilant contrast. Enough to look
  alive and prove the mechanism; not gold-plated.

## Deliberate departures from the brief's stack (each noted)

- **Real LPC formant analysis instead of wav2vec2 + MFA.** Formant estimation is
  honest, on-device, offline, and genuinely discriminates vowels — and it drives
  the mouth diagram directly. wav2vec2 is the documented production upgrade
  (ARCHITECTURE §6). *This keeps the "Technical Complexity" story real while
  guaranteeing a clean run.*
- **Procedural 2D SVG sagittal mouth instead of Three.js blendshapes.** A side
  cross-section is actually *better pedagogy* for showing tongue position, has no
  3D asset/dependency, and reliably renders. The articulation params already
  exist to drive a 3D head later.
- **Deterministic dialogue engine instead of Phi-3/Ollama.** A local LLM is the
  wrong tool for an offline $50 tablet (size, latency, non-determinism). The
  template engine is instant, tiny, and lets us *guarantee* the collaborative
  "Sparky fails too" tone that is the product's emotional core. LLM stays a
  drop-in upgrade.
- **Plain state-driven game loop instead of Phaser.js.** The "game" here is XP +
  levels + a reactive companion, which React handles cleanly. Phaser would be
  dead weight.
- **localStorage instead of IndexedDB (for now).** The save document is tiny and
  must work offline; localStorage is the simplest reliable choice. The store
  interface is DB-agnostic, so swapping to IndexedDB is a one-file change.

## Product / framing assumptions

- **Judges will use it themselves, possibly with no working mic.** → Built a
  synthetic-voice fallback so the *full* loop demos on any machine; added a clear
  "Demo voice (no mic)" badge so we never misrepresent what's happening.
- **Reference formants are adult (Peterson–Barney); children's are higher.** →
  Scoring uses **relative** position in the vowel space and is intentionally
  lenient (encouraging for 4–6-year-olds). Per-child calibration is the
  production fix; noted, not faked.
- **"Fully offline" is a feature, not a limitation** for the Title I / Fire
  tablet target (and a COPPA/privacy advantage: audio never leaves the device).
- **The "$35 Fire tablet" in the brief is a deep-sale price.** Verified list
  price for a current Fire HD 8 is **$99.99** (RESEARCH §sources). We kept the
  "cheap tablet schools already own, offline-first" thesis but corrected the
  number rather than repeating it.

## Engineering choices

- **Strict TypeScript, commented DSP, clear `audio/`–`game/`–`components/`
  boundaries, MIT-licensed (open source).** Directly targets the "Quality of
  Code" rubric line, which rewards commented + open-source + presenter-understood
  code and punishes AI-slop.
- **External store via `useSyncExternalStore`** (not Context/Redux) — one source
  of truth, no boilerplate, idiomatic.
- **Seed data is deterministic** (mulberry32 PRNG) so demos and screenshots are
  reproducible, and dates are anchored to "today" so the trend chart always looks
  current.
- **Project folder location:** created at `~/phonicsforge` (the brief didn't
  specify a parent dir; home root is the neutral default).
- **Deployment target: Vercel** (a hackathon sponsor) — it's a static Vite build,
  so `npm run build` → deploy `dist/` with zero config.

## Known limitations (honest)

- Synthetic demo voice can score ~100% (it emits near-perfect target formants);
  real mic input is noisier and lands lower — the README demo script accounts for
  this by practising a *low-mastery* sound to show a visible gain.
- Formant estimation is tuned for clear single vowels in a quiet room; noisy
  classrooms and connected speech need the production ASR tier.
- No auth/accounts/multi-profile — out of scope for the wedge (one local learner).
