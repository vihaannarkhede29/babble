# 🐲 PhonicsForge

**Speech coaching for pre-readers.** A child taps the mic and says a word; the
app recognises their speech, scores it against the target word (with fuzzy
matching, so a near-miss like "sip" for "ship" earns partial credit and targeted
coaching), and a companion dragon — **Sparky** — cheers them on so a miss feels
like teamwork, not failure. Progress is tracked per sound with a measurable
**accuracy % over time** for parents and teachers.

> **Two recognition modes.** The default uses the browser's **Web Speech API**
> (robust, real ASR — needs Chrome/Edge/Safari + internet). Where that's
> unavailable (e.g. Firefox, offline), it automatically falls back to an
> **on-device formant analyser** with a procedural mouth diagram — fully offline,
> no audio leaves the device. See `docs/DECISIONS.md` for the tradeoff.

> Built for **Milpitas Hacks 2 — Track 1: Interactive Learning** ("reimagine
> early childhood learning around *sound and visuals instead of reading*, with
> *game mechanics and playful rewards*").

---

## Quick start

Requires **Node 18+** (developed on Node 26). No accounts, no API keys, no
secrets — see `.env.example` (there's nothing to fill in).

```bash
git clone <this-repo> phonicsforge
cd phonicsforge
npm install
npm run dev          # → http://localhost:5173
```

Open the URL in **Chrome or Edge**, allow the microphone, tap the mic, and say
the word. Speech recognition needs a **secure context** (localhost or HTTPS) and
an internet connection. In an unsupported browser the app automatically switches
to the offline formant coach.

Other scripts:

```bash
npm run build        # type-check (tsc) + production build to dist/
npm run preview      # serve the production build on :4173
npm run typecheck    # types only
```

### Deploy (optional)

It's a static build, so any static host works. For **Vercel** (a hackathon
sponsor): `npm i -g vercel && vercel` — framework auto-detected as Vite, output
`dist/`. HTTPS is provided automatically (the microphone requires a secure
context: `https://…` or `localhost`).

---

## The 60-second demo ("here's the magic")

1. **(0:00) Open.** "This is PhonicsForge — a speech coach for kids who can't read
   yet. Meet Sparky." The Coach shows a word: **"sun" ☀️**.
2. **(0:10) Say a word.** Tap the mic and say **"sun"**. The volume ring pulses as
   you speak; a beat later the **score** appears, Sparky celebrates, **+XP**.
   "That's real speech recognition matching what I said to the target word."
3. **(0:25) Show the coaching.** Switch to **"ship" 🚢** and deliberately say
   **"sip"** (the classic /s/-for-/ʃ/ lisp). It scores ~75 and Sparky says
   *"So close! I heard 'sip' — listen for the SH sound, try 'ship'."* Targeted,
   not just pass/fail.
4. **(0:35) Show the companion.** A good attempt → confetti, level-up; a missed
   one is reframed as teamwork, never shame.
5. **(0:45) Show the outcome.** Open the **Progress** tab: **mastery over time**,
   a **Sounds to focus on next** list, before→after, and one-click **Export
   progress (CSV)** — a clean accuracy log for an SLP (no audio, just numbers).
6. **(0:55) Land it.** "Real ASR with fuzzy phoneme matching, an offline fallback
   for any device, and measurable progress. That's PhonicsForge."

> **Tip:** for the lisp demo in step 3, "sip" reliably triggers the SH-sound
> coaching. Run it in **Chrome/Edge** with the mic allowed.

---

## What's real vs. what's faked

**Real:**
- 🗣️ **Speech recognition** — the browser's Web Speech API (`maxAlternatives: 3`)
  transcribes the spoken word. (`src/speech/useSpeechRecognition.ts`)
- 🎯 **Fuzzy word matching** — `matchWord` scores the transcript against the target
  with **Levenshtein** edit distance: exact/homophone → 100, near-miss → partial
  credit + the specific sound to fix. (`src/speech/match.ts`)
- 🔊 **Live volume ring** on the mic button via a Web Audio AnalyserNode.
- 🧩 **Offline fallback is real DSP** — when there's no Speech API, an on-device
  formant analyser (RMS, ZCR, FFT centroid, **LPC** formants with a voicing
  hysteresis gate + median trajectory filter) drives a procedural mouth diagram.
  (`src/audio/dsp.ts`, `MicCoach`)
- 🕹️ **Game state** — XP, levels, attempts — persisted offline in `localStorage`.
- 📊 **Dashboard** — Recharts over the real attempt log; before→after metric, a
  deterministic "focus next" list, and one-click **CSV export** — all from real data.
- 🔊 **The no-mic fallback is also real DSP**: a source–filter speech
  *synthesizer* generates a vowel waveform with the target formants, which flows
  through the *same* analysis pipeline.

**Seeded / simplified for the MVP (clearly, honestly):**
- 📈 A **deterministic 14-day practice history** is seeded on first run so the
  dashboard looks alive. (Resettable via the Progress tab.)
- 🧒 Phoneme targets use **adult reference formants**; children's are higher, so
  scoring is *relative* and lenient. Per-child calibration is the production fix.
- 🐲 Sparky's encouragement is a **deterministic template engine**, not an LLM.
- The brief's heavier stack (wav2vec2/MFA, Three.js blendshapes, Ollama/Phi-3,
  Phaser) is intentionally **not** used in the MVP — see
  [`docs/DECISIONS.md`](docs/DECISIONS.md) for why, and
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) §6 for the production path.

---

## How it works (one paragraph)

**Primary (speech mode):** the browser's Speech API returns up to three candidate
transcripts of the spoken word; `matchWord` compares each to the target with
Levenshtein edit distance, accepts exact matches and homophones, and gives
partial credit + a named sound to fix for near-misses.

**Fallback (offline DSP mode):** the first two **formants** (resonances) of a
voiced sound encode how the vocal
tract is shaped: **F1** tracks how open the mouth is, **F2** how far forward the
tongue sits. Those are exactly the two numbers you need to *score* a vowel and to
*draw* the correct tongue position — so PhonicsForge estimates them live with LPC
and uses the same coordinates to power the meter, the vowel-chart marker, and the
animated mouth. Sibilants like /s/ and /ʃ/ have no formant structure, so they're
scored on spectral brightness (centroid) instead. Full detail in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Project layout

```
phonicsforge/
├─ README.md
├─ LICENSE                 # MIT (open source)
├─ .env.example            # documents that NO env/secrets are needed
├─ index.html
├─ vite.config.ts          # + PWA (offline service worker)
├─ docs/
│  ├─ RUBRIC.md            # judging criteria + how this build targets each
│  ├─ RESEARCH.md          # problem/market validation, cited sources, risks
│  ├─ ARCHITECTURE.md      # diagram, data model, flows, real-vs-stub, stack
│  └─ DECISIONS.md         # assumptions + brief↔rubric conflicts
├─ public/icons/icon.svg
└─ src/
   ├─ speech/   # useSpeechRecognition, useMicVolume, words, match (PRIMARY)
   ├─ audio/    # capture, dsp, phonemes, scorer, calibration, practice-engine (fallback)
   ├─ game/     # store, seed, dragon
   ├─ components/  # WordPractice, MicCoach, MouthDiagram, VowelSpace, Dragon, Dashboard
   └─ lib/      # types, colors, session
```

## Documentation

- [`docs/RUBRIC.md`](docs/RUBRIC.md) — the judging rubric and our per-criterion strategy
- [`docs/RESEARCH.md`](docs/RESEARCH.md) — validation, market, competitors, risks, 18 cited sources
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design and data flow
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — assumptions and trade-offs

## License

[MIT](LICENSE) — open source.
