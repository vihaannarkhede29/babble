# Judging Rubric — Milpitas Hacks 2

Extracted from the two PDFs in `~/Downloads/slides`:
`Milpitas Hacks 2, Judging Guidelines.pdf` and `MH3 Opening Ceremony.pdf`.

## How judging works (from the guidelines)

- **7 categories**, each scored **1–10, no decimals** (the guidelines text says
  "6 categories"; the rubric table actually lists **7** — see DECISIONS.md).
- **No weights are given.** Every category counts equally toward the total.
  Strategy implication: a balanced build that scores well on *all seven* beats a
  spiky one that maxes Technical and neglects Design/Functionality.
- Judging is a live session — **Presentation + Q&A + Code Review, capped at
  ~4–5 minutes.** Judges **freely use the project themselves** and review the
  code with the presenter.
- Grading may be **algorithmically adjusted for rigor/fairness.**

## Theme / track

**Track 1 — Interactive Learning:** *"Reimagine early childhood learning with
interactive experiences designed around **sound and visuals instead of
reading**. Use creative **game mechanics and playful rewards** to make learning
engaging and memorable."*

## Build window (from the schedule)

Single-day event: **9:00 Begin Coding → 7:30 Project Deadline ≈ 10.5 hours.**
This scopes the MVP — see DECISIONS.md for what we cut to fit.

## The seven categories, and how PhonicsForge targets each

| # | Category | Weight | How this build targets it |
|---|----------|--------|---------------------------|
| 1 | **Innovation & Creativity** | equal | The same live formant measurement *both* scores the sound *and* drives a procedural mouth diagram + a vowel-space marker. A companion dragon that "fails alongside" the child reframes mistakes as collaboration. Underexplored niche. |
| 2 | **Technical Complexity & Execution** | equal | Real DSP, hand-written, no black-box library: pre-emphasis → decimation → autocorrelation → **Levinson–Durbin LPC** → formant peak-picking, plus an FFT spectral centroid and a source–filter speech **synthesizer** for the no-mic path. Runs fully on-device. |
| 3 | **Functionality & Usability** | equal | Judges use it in seconds: tap to start, hold & speak, watch the score/mouth/marker react live. A built-in demo voice guarantees it works on *any* laptop even with no mic or denied permission. |
| 4 | **Design & Presentation** | equal | Polished, kid-first violet UI; big touch targets; one-screen landscape layout for the target Fire tablet. A tight 60-second demo script (README) keeps the live pitch confident. |
| 5 | **Impact & Practicality** | equal | Aims at a documented crisis (only **31%** of US 4th-graders read proficiently, NAEP 2024) and an under-served niche (**8–9%** of young kids have speech-sound disorders; **78%** SLP shortage). Offline-first for Title I classrooms. Measurable before→after accuracy outcome. |
| 6 | **Relevance to theme/track** | equal | Bullseye on Track 1: learning through **sound + visuals, not reading**, with **game mechanics & playful rewards** (XP, levels, dragon). |
| 7 | **Quality of Code** | equal | Open source (MIT), heavily commented (esp. the DSP), clear module boundaries (`audio/` `game/` `components/` `lib/`), TypeScript strict mode, no secrets. Built to be *explained* by the presenter during code review — the explicit opposite of "blatantly AI generated." |

See `RESEARCH.md` for the cited sources behind the Impact figures.
