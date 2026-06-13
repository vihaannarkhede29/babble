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

## Noise robustness (added after live-mic testing)

Early live-mic use surfaced two coupled bugs: the score swung wildly on
background noise, and a hold could eventually be rewarded XP even when the child
said nothing. Both traced to a single weak gate — energy alone (`rms > 0.014`) —
which let aperiodic room noise reach the LPC formant step, and a scoring rule
that took the single best frame of a hold (so one fluke "locked in" a win). Fix:

- **Periodicity gate** — frames must be quasi-periodic (voiced) to count, via an
  autocorrelation-based voicing confidence in dsp.ts. White noise at speech
  loudness now scores 0 (verified).
- **Adaptive noise floor** — the engine learns ambient RMS while idle and
  requires speech clearly above it.
- **Sustained scoring** — an attempt's score comes from a smoothed run of voiced
  frames, and **no attempt/XP is recorded unless enough voiced frames occurred**
  (so silence → "I didn't hear you", never a reward).
- **Browser `noiseSuppression` enabled** at the mic (was off) as a second layer.

## Feedback round 2 — sensitivity, trajectory, whole-word, and the "investor" list

User feedback + a pasted list of investor-style feature ideas, triaged.

**Implemented now (from the direct feedback):**
- **Voicing hysteresis (Schmitt trigger).** The earlier fix was too strict and
  "missed the voice sometimes." Now it's *hard to start* voicing (enter ≥ 0.42
  periodicity — rejects noise) but *easy to keep* (sustain ≥ 0.26 — won't drop a
  quiet/breathy child mid-vowel). Energy floors lowered too. Noise is still
  rejected (verified: white noise scores 0).
- **Median trajectory filter.** The live marker/mouth now follow the *median* of
  the last ~6 voiced frames, not the instantaneous value — it tracks the steady
  tone instead of jittering. (Direct answer to "track the trajectory… not
  volatile.")
- **Whole-word framing.** The prompt now leads with the word ("Say *sheep*") and
  underlines the target letters; we still score the target sound within the
  utterance. (Saying a whole word is easier for kids than an isolated phoneme.)
- **CSV export** of the practice log (the hand-to-an-SLP artifact) and a
  **deterministic "focus next" list** (lowest-mastery sounds) on the dashboard.

**Already true (the investor list re-describes existing behavior):**
- "Audio-reactive mesh deformer" — the mouth diagram *already* warps to the
  child's measured formants live (colour-coded), with the dashed target to
  return to. (We did not add Three.js; the 2D sagittal view is clearer pedagogy
  and dependency-free. A 3D head is deferred polish.)
- "Edge fingerprinting / never store audio" — *already* the architecture: audio
  never leaves memory; we persist only derived scores `{phonemeId, score, at}`.

**Deferred (needs more than the wedge):**
- True **word-level / multi-phoneme** scoring — needs the production ASR/forced-
  alignment tier; today we score the target sound inside the word.
- **Friction telemetry** (amplitude drops + touch-latency → "structural block" →
  auto muscle-warmth routine) — needs new signal capture *and* rests on an
  unvalidated inference (quiet ≠ necessarily anxiety). Save for a pilot.
- **Full SLP clinical portal** (multi-axis behavioral charts, print-preview
  report) — CSV export is the immediately-useful slice; the rest is product work.

**Contradictions / claims rejected (flagged, NOT shipped):**
- ❌ **"HIPAA-compliant."** HIPAA governs covered healthcare entities handling
  PHI; a consumer app storing data in `localStorage` is not HIPAA-grade, and
  saying so would be a false claim. The relevant regime for kids is **COPPA** —
  which the on-device design genuinely helps with.
- ❌ **"Neuromorphic."** That means brain-inspired spiking hardware; nothing here
  is. It's real-time audio-reactive animation. Using the word invites a
  knowledgeable judge to ding it.
- ❌ **"Backend script… at the edge."** There is no backend — it's fully
  client-side, which is a *stronger* privacy story, so we say that instead.
- ⚠️ **"Anonymous acoustic vector fingerprint."** A persistent per-child acoustic
  fingerprint could itself be **biometric PII** under the FTC's Jan-2025 COPPA
  biometric rule — the opposite of "anonymous." We deliberately store only
  coarse accuracy scores, not an identifying voiceprint, and frame it that way.

## Feedback round 3 — "some sounds are hard even for a clear adult"

User tested on a real mic: EE/EH/OH/OO work; cat(AA), car(AH), and the sibilants
are hard; "pitch doesn't have to be perfect." A 4-lens adversarial review panel +
in-browser experiments (synth vowels at shifted formants/pitch) pinned the causes
— and corrected two of my first instincts.

**Root causes found (the estimator is fine — all sounds self-score ≥0.97 on clean audio):**
- **F1 clamping.** The open vowels' F1 (cat ~660, hot ~730, higher for non-male
  speakers ~900–1100) hit the old `F1_MAX = 850` ceiling and all collapsed to
  "fully open," so they were the hardest to place. **This, not tolerance, was the
  main bug.**
- **"car" is R-coloured** ([kɑɹ]) — its formants don't match the /ɑ/ target.
- **noiseSuppression** (added round 2) attenuates the 6–8 kHz /s/ hiss, dragging
  measured /s/ toward /ʃ/.

**Implemented now (all verified in-browser, build green):**
- `F1_MAX` 850 → **1000** — un-saturates the open axis; adult self-scores
  unchanged, but a +18% higher-pitch speaker's AA 0.74→0.79 and AH 0.78→0.90.
- `VOWEL_SIGMA` 0.30 → **0.36** — lenient cushion that stays *below* the praise
  gate for wrong-neighbour vowels (so feedback still teaches).
- `SIBILANT_SIGMA_OCT` 0.60 → **0.70** + `/s/ centroidTarget` 6500 → **6000** —
  a dull (suppressed) /s/ at 5200 Hz now scores 0.92 on /s/, still beats /ʃ/.
- AH example word **"car" → "hot"** (clean /ɑ/, non-rhotic).

**Corrected by the panel (things I was about to do that were wrong):**
- ❌ Don't just widen σ to ~0.45 — scoring is vs the *active target only*, so σ
  doesn't fix per-speaker offset, and ≥0.45 makes wrong neighbour vowels cross
  the praise gate. Kept σ modest and fixed the geometry (F1_MAX) instead.
- ❌ Don't flip `noiseSuppression` OFF globally — the sibilant path has no
  periodicity gate and the sibilant scorer has no upper-distance cutoff, so noise
  would score as /ʃ/. Lowered the /s/ target to compensate for suppression instead.

**Deferred (with the trigger to build):**
- **Per-speaker calibration** (3-anchor affine map: say EE/AH/OO once → fit the
  speaker's vowel space → apply before scoring). The principled fix for "hard for
  any non-adult-male speaker"; ~30 lines of math but ~½ day of first-run UX/state.
  *Build it if real higher-pitch testing still fails AA/AH after these param fixes.*
- **High-F0 formant robustness.** At child pitch (F0 ≈ 250–300 Hz) the LPC F2
  estimate for close-formant vowels (OH, and EE/EH) can collapse (sparse
  harmonics). This is the real frontier for the *child* end; needs a sturdier
  estimator (higher order / cepstral) or the calibration above.
- **Sibilant high-frequency-energy gate** — required *before* `noiseSuppression`
  could safely be turned off (so room noise can't score as /ʃ/).
- **Slow replay of the formant trajectory on the chart** — user-requested, no
  scoring impact, straightforward (we already record the trajectory).
- **Webcam capture + face-overlay digital mouth** — user-requested polish; defer.

## Feedback round 4 — pivot to the Web Speech API (whole-word recognition)

After repeated real-mic testing, the hand-rolled formant/LPC scoring still didn't
work reliably on the user's actual voice. Rather than keep tuning a brittle DSP,
we pivoted the primary recognition to the browser's **Web Speech API**
(`SpeechRecognition`) — production-grade ASR that genuinely understands speech —
and match the transcript to the target **word** with Levenshtein fuzzy matching.

**What changed:**
- New `src/speech/`: `useSpeechRecognition` (3 alternatives, silence timeout,
  support check), `useMicVolume` (live mic-loudness ring on the button),
  `words.ts` (5 starter words + phoneme maps + homophones), `match.ts`
  (Levenshtein + `matchWord`). New `WordPractice` screen is the Coach now.
- Words map to existing phoneme ids, so the XP/mastery dashboard is unchanged.
- Homophones are accepted ("son"→sun, "read"→red); near-misses give targeted
  coaching ("I heard 'sip' — listen for the SH sound").

**The honest tradeoff (this overturns an earlier pillar):**
- ⚠️ In Chrome the Speech API **streams audio to Google's servers**, so the
  primary path is **online, not on-device**. This contradicts the earlier
  "fully offline / audio never leaves the device / COPPA-friendly" framing.
  We chose **it actually works** over the offline ideal — the right call given
  the user's repeated "it doesn't work." The privacy/offline story now applies
  to the *fallback*, not the default.
- It needs a **secure context** (localhost or HTTPS) for the mic; `http://` on a
  LAN IP has no `navigator.mediaDevices` (we guard this so it never crashes).
- Browser support: Chrome/Edge (and Safari) yes; **Firefox no**.

**Kept as the offline fallback:** the entire formant engine (dsp/scorer/
calibration/usePracticeEngine + MicCoach) is retained and rendered automatically
when `SpeechRecognition` is unavailable — so the offline/on-device path still
exists for unsupported browsers. The per-speaker calibration scaffolding
(`calibration.ts`) also remains for that path.

**Couldn't verify here:** a real "say the word → recognized → scored" round trip
needs a live mic + network, which headless Playwright doesn't have. Verified
instead: the full `matchWord`/Levenshtein logic (exact/homophone/fuzzy/phrase),
support detection, UI render, and graceful error/no-speech handling (no crash).
The live ASR path is for the user to confirm in Chrome on localhost/HTTPS.

## Known limitations (honest)

- Synthetic demo voice can score ~100% (it emits near-perfect target formants);
  real mic input is noisier and lands lower — the README demo script accounts for
  this by practising a *low-mastery* sound to show a visible gain.
- Formant estimation is tuned for clear single vowels; very noisy classrooms and
  connected speech still want the production ASR tier (the periodicity gate
  mitigates noise but doesn't replace a trained model).
- No auth/accounts/multi-profile — out of scope for the wedge (one local learner).
