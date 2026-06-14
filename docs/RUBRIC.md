# Babble — Judging Rubric Map

How Babble — real-time, in-browser speech coaching for pre-readers (ages ~3–8) — maps to an interactive-learning judging rubric. Babble is an offline-first PWA with no backend, no accounts, and 100% on-device processing. Built for Milpitas Hacks 2, Track 1: Interactive Learning.

Each category below cites the concrete features that target it.

## Impact / Problem Fit

- **Targets pre-readers, the hardest group to coach.** Babble is built for ages ~3–8 who can't read instructions, so the entire experience is voice-and-character driven: a child *teaches a dragon to talk* rather than reading a worksheet.
- **A screening experience framed as play.** The Teach Blaze diagnostic is a disguised phoneme screener covering ~27 words — early sound-development insight delivered as a game a 4-year-old wants to play, one attempt per word.
- **Actionable for the adult, too.** The PIN-gated parent report surfaces top sounds to work on with concrete mouth cues, plus a "ready-for-therapy" SLP summary table with CSV export — turning play into something a parent or speech-language pathologist can act on.
- **Zero barrier to use.** Offline-first, no accounts, no secrets, no env vars: it runs from a clean clone and keeps working with no signal, where the target families actually are.

## Technical Execution

- **A hand-rolled DSP engine, not a wrapped library.** `src/audio/` implements LPC formant estimation, FFT, and Gaussian formant-distance scoring from scratch — powering both the live interference-wave visualization (WaveCanvas) and MicCoach, a genuine offline fallback grader for browsers without the Web Speech API (e.g. Firefox).
- **Two real graders, deliberately separated.** The primary path uses the browser Web Speech API to transcribe speech, then `matchWord()` scores it with Levenshtein fuzzy string similarity (0–100, exact word / accepted homophone = 100). The DSP path is the offline fallback. Both feed the same game store.
- **Live adaptive analytics.** The Dashboard's `adaptiveSeries()` (`src/game/store.ts`) auto-zooms its time axis to the actual data span — by HOUR on day one, then DAYS → MONTHS → YEARS as history grows — and plots only what the child really said, updating live with an honest empty state before the first rep.
- **Disciplined modern stack.** Vite 5 + React 18 + TypeScript in strict mode with `noUnusedLocals`; state via the React `useSyncExternalStore` external-store pattern backed by `localStorage`; deterministic word scheduling in `src/speech/wordSchedule.ts`.

## Innovation / Originality

- **The interference wave.** Instead of a generic level meter, WaveCanvas renders a live "interference wave" driven by the real formant/DSP engine — the child literally sees their voice interacting with the target sound.
- **A diagnostic disguised as nurturing a creature.** Teach Blaze reframes a phoneme screener as raising a just-hatched dragon: a Blaze energy bar fills as words are said, ending in hand-rolled canvas confetti and a star rating. The clinical content is invisible to the kid.
- **The dictionary "deep cut."** The optional dictionary layer (`src/speech/dictionary.ts` + `WordInfo.tsx`) shows real IPA, a kid-friendly definition, and a 🔊 clip — but hides an obscure "deep cut" definition that only reveals when a curious user *pries* (double-click / long-press). A delight detail, never shown by default.
- **Two distinct dragon companions with roles.** "Blaze" is the dragon the child teaches (CSS-animated SVG, 6 states); "Sparky" is the Coach's mic-driven helper whose mouth moves with the child's voice.

## Interactivity & UX

- **Speak, see, celebrate — the core loop.** The child says a word; after each Coach attempt a clean score card shows the 0–100%, the recognized word, and a "match score" caption. Real reps earn XP on a gentle sqrt level curve, and level-ups fire confetti.
- **Built around a non-reader.** Onboarding is a 4-step character-led flow (meet Blaze → name child + dragon + age → tricky sounds + session length → optional 4-digit parent PIN); the live mic-driven Sparky and animated Blaze keep the interaction visual rather than textual.
- **Personal and goal-driven.** The child can "add your own word" (rule-based g2p breakdown) and those words surface first in Today's rotation; Home shows a daily-goal progress ring that completes with "Daily goal complete! 🎉".
- **Right-sized navigation.** Onboarding, Teach Blaze, and the diagnostic run full-screen with no header to stay immersive; everything else wears a branded header with a live XP/level bar.

## Design / Polish

- **A coherent, kid-warm visual system.** Plain CSS with CSS variables and the Nunito font — deliberately no Tailwind, no Framer Motion, no heavy state libs — keeping the bundle lean and the look consistent.
- **Hand-built motion and feedback.** CSS-animated dragon SVGs with multiple states, canvas confetti, and a star rating give celebratory moments without pulling in an animation framework.
- **Honest, legible result surfaces.** The Coach's clean score card, the parent report's phoneme grid, and the Dashboard's mastery-by-sound bars and before→after accuracy delta present data clearly to both kid and adult audiences.
- **40 illustrated words across 8 focus sounds** (vowels /iː ɛ æ ɑː oʊ uː/ plus the /s/ and /ʃ/ sibilants) — enough variety to stay fresh while keeping the mastery charts coherent.

## Completeness / Demo-Readiness

- **Runs from a clean clone, every time.** `npm install` then `npm run dev` (or `npm run build` + `npm run preview`) on Node 18+ — no backend, no secrets, no env vars to configure before a demo.
- **Installable, offline PWA.** vite-plugin-pwa makes Babble installable with service-worker precache; the core grader never depends on the network, so it demos with the WiFi off.
- **A real end-to-end flow.** A first-run gate funnels new users through onboarding into a full journey: Home hub, the Coach (`/practice`), Teach Blaze diagnostic → PIN-gated report, PIN-gated dashboard, and settings — all routed in `src/App.tsx`.
- **Persistent and self-seeding.** All state lives under the `babble.*` localStorage namespace (`babble.game.v2`, `babble.profile.v1`, `babble.diagnostic.v1`, and others); there is no fabricated seed data, so whatever the judge sees on stage is real.

## Integrity / Honesty

- **We state exactly how grading works.** The verdict is Web Speech recognition plus fuzzy word-match string similarity — a 0–100 scalar, *not* acoustic — and the hand-rolled formant/DSP engine powers visualization and the offline fallback. There is no cosine similarity anywhere, and we don't claim one.
- **The screener never fabricates per-phoneme numbers.** The Web Speech API returns word-level transcripts only, with no per-phoneme confidence, so `src/diagnostic/inference.ts` infers honestly: a sound is "clear" if at least one whole screener word containing it was said correctly, "practise" if every word testing it missed, else "untested". We never invent a "/ʃ/ = 73%".
- **The report says what it is.** The PIN-gated parent report carries an explicit note that this is a playful early screener, **not** a clinical diagnosis.
- **Real XP, real stats, real privacy.** XP is earned only from actual reps — no seed data. Everything is on-device: no audio or video ever leaves the browser (webcam is opt-in; clips are in-memory object URLs, gone on reload). The only network call is the optional, cached dictionary lookup — a single word string sent to a public, key-less API.
