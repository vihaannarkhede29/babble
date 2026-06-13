# 🐲 PhonicsForge

**Real-time speech coaching for pre-readers.** A child taps, holds, and makes a
sound; the app measures their pronunciation *on-device* from the live audio,
shows a procedurally-drawn mouth diagram of exactly where to put their tongue and
lips, and a companion dragon — **Sparky** — learns the sound alongside them so a
miss feels like teamwork, not failure. It's a fully-offline PWA built to run on
the cheap tablets real Title I classrooms already own, and it turns a fuzzy goal
("say it better") into a measurable one (**accuracy % before → after**).

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

Open the URL, click **Tap to start**, and allow the microphone when asked.
**No microphone (or you click "block")? It still works** — Sparky falls back to a
built-in synthetic voice and the entire experience runs.

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

1. **(0:00) Open + start.** "This is PhonicsForge — a speech coach for kids who
   can't read yet. Meet Sparky." Click **Tap to start**.
2. **(0:10) Speak a vowel.** Hold **Hold & speak** and say **"eeee"**. Watch
   three things move *together, live*: the **score meter** climbs, the **tongue
   in the mouth diagram** slides into place and glows green, and the **dot on the
   vowel chart** jumps to the EE corner. "That's not scripted — it's the live
   formants of my voice, measured in the browser."
3. **(0:25) Prove it's real.** Switch to **AH** ("car") and say "ahhh". The dot
   leaps to the opposite corner. Different sound → different measurement.
4. **(0:35) Show the companion.** Make a deliberately bad attempt. Sparky says
   *"Oof, that one's tricky for me too — try again with me!"* — failure reframed
   as collaboration. A good attempt → confetti, **+XP**, level-up.
5. **(0:45) Show the outcome.** Open the **Progress** tab. Point at **"+X%
   average accuracy gain this session"** and the **before → after** row. "This is
   the measurable bit teachers and parents care about." The **Sounds to focus on
   next** list and mastery chart flag that the **/s/ and /ʃ/ sibilants lag** —
   the classic real-world articulation target — and **Export progress (CSV)**
   hands a clean accuracy log to an SLP (no audio, just the numbers).
6. **(0:55) Land it.** "Runs fully offline on a $50 tablet, kids' audio never
   leaves the device, and there's no login. That's PhonicsForge."

> **Tip for a bigger before→after number:** in step 5, first practise a
> *low-mastery* sound (e.g. **OO** or **SSS**) a few times so the session gain is
> visibly large.

---

## What's real vs. what's faked

**Real (runs live, on-device):**
- 🎙️ **Microphone capture** via the Web Audio API.
- 🔬 **The signal processing.** Hand-written DSP — RMS, zero-crossing rate, an
  **FFT** spectral centroid, and **LPC formant estimation** (pre-emphasis →
  decimation → autocorrelation → Levinson–Durbin → spectral-envelope
  peak-picking). The score and the mouth diagram are both driven by these live
  measurements. (`src/audio/dsp.ts`)
- 🎯 **Scoring** against reference vowel formants, with real coaching hints. A
  **voicing hysteresis gate** + **median trajectory filter** keep it noise-robust
  and steady (background noise scores 0; the marker tracks the sound, not jitter).
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

The first two **formants** (resonances) of a voiced sound encode how the vocal
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
   ├─ audio/    # capture, dsp, phonemes, scorer, practice-engine hook
   ├─ game/     # store, seed, dragon
   ├─ components/  # MouthDiagram, VowelSpace, ScoreMeter, Dragon, MicCoach, Dashboard
   └─ lib/      # types, colors, session
```

## Documentation

- [`docs/RUBRIC.md`](docs/RUBRIC.md) — the judging rubric and our per-criterion strategy
- [`docs/RESEARCH.md`](docs/RESEARCH.md) — validation, market, competitors, risks, 18 cited sources
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design and data flow
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — assumptions and trade-offs

## License

[MIT](LICENSE) — open source.
