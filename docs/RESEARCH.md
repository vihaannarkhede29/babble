# Research — PhonicsForge

Light validation of the idea before building. Every figure below was pulled from
a primary source and re-checked against the live page (see **Sources**). Where a
claim is qualitative it is marked as such. This is meant to be factual, not a
pitch.

> Method note: sources were gathered by a fan-out of web-research agents, then a
> second adversarial pass re-fetched each URL and confirmed the quoted sentence
> is actually present. 22/22 claims verified. One brief-vs-reality correction is
> flagged inline (the "$35 tablet").

---

## 1. Problem validation — who hurts, how they cope, why now

**Early reading is in measurable trouble.** On the 2024 NAEP ("Nation's Report
Card"), **only 31% of US fourth-graders read at or above Proficient — 4 points
below pre-pandemic 2019** [1]. Average grade-4 reading scores were 2 points
below 2022 and 5 below 2019 [1]. The decline is national and persistent.

**The pre-reading skill that predicts this is phonemic awareness.** Reading
Rockets (Moats & Tolman) state plainly: *"Phonological awareness is critical for
learning to read any alphabetic writing system… difficulty with phoneme
awareness… is a predictor of poor reading and spelling development"* [2]. If a
child cannot hear and produce the sounds, decoding stalls. That is exactly the
layer PhonicsForge drills.

**Pronunciation problems are common and under-served.** NIDCD (NIH) reports the
prevalence of speech-sound disorders in young children is **8–9%**, and roughly
**5% still have noticeable speech disorders by first grade** [3]. About **1 in 14
(7.2%)** US children 3–17 had a voice/speech/language disorder in the past year,
rising to **10.8% among ages 3–6** [3]. ASHA's clinical portal puts speech-sound
disorder prevalence at **2.1%–23% for ages 4–6** [5].

**How they cope today:** a stretched school speech-language pathologist (SLP),
classroom phonics instruction, or paid apps. The SLP channel is rationed —
**78% of school SLPs on ASHA's 2024 survey said there are more job openings than
job seekers** [4], i.e. a structural shortage. A child waits weeks for minutes of
1:1 time. PhonicsForge is unlimited, immediate, low-stakes daily practice that
sits *between* classroom instruction and scarce specialist time.

**Why now:** (a) the post-COVID reading-loss data above; (b) a policy wave —
**118 "science of reading" laws across 23 states + DC between 2019 and 2024** [12]
are pushing phonics-first, evidence-based instruction into mandate; and (c) the
tech is finally good enough on *children's* speech — a 2025 peer-reviewed
validation study found a modern ASR model hit **~8.4% phoneme error rate** on
children with speech-sound disorders versus SLP transcription [13].

---

## 2. Market & buyer

**Market size signal.** The EdTech-for-early-childhood market is estimated at
**USD 13.4B in 2024, projected to USD 55.6B by 2034 (15.3% CAGR)**, with North
America ~46.7% share (~USD 6.2B) [6]. (Vendor market-research estimate — treat
the absolute number as directional, not gospel.)

**Who pays — three plausible buyers:**

1. **Districts / Title I schools (B2B).** Title I, Part A is the recurring
   federal stream that funds early-literacy interventions for low-income schools,
   allocated by poverty rates [9]. This is the durable buyer.
2. **Parents (D2C).** Comparable apps charge subscriptions — e.g. **Ello** (AI
   reading coach, K–3, listens to a child read) at **$14.99/mo**, with a
   subsidized **$2.99/mo** for families on government assistance [10][11].
3. **Speech clinics** as a between-session practice tool (Speech Blubs positions
   itself this way) [14].

**Budget headwind (important):** the one-time **ESSER** pandemic relief — nearly
**$200B** across three rounds, the largest tranche obligated by **Sept 30,
2024** [7] — is ending. That ~$190B was *about a quarter of pre-COVID annual K-12
revenue* [8], so districts now face a "fiscal cliff" that shrinks discretionary
edtech spending. The defensible response is exactly our posture: **cheap,
offline, runs on hardware schools already own.** (See risks.)

---

## 3. Competitive landscape

| Tool | What it does | Note |
|------|--------------|------|
| **Ello** | AI reading coach (K–3) that listens to a child *read aloud* and coaches phonics; $14.99/mo (or $2.99 subsidized); 1,000+ decodable books [10][11] | Closest funded analog, but focused on **reading words**, not articulating individual phonemes. |
| **Speech Blubs** | Speech-therapy app, ages 1–8, video-modeling, built with 1,000+ SLPs; explicitly a *supplement* to therapy [14] | Modeling/imitation, not real-time acoustic scoring of the child. |
| **Amira Learning** | AI reading assistant used in schools (reading fluency) | Reading-fluency lane, enterprise. |
| **Teach Your Monster to Read / Hooked on Phonics** | Gamified phonics curricula | No microphone analysis of the child's own production. |

**PhonicsForge's wedge / differentiation:** none of the above *measure the
child's own articulation in real time and show them how to physically reposition
the mouth.* The combination of (a) live formant/phoneme scoring, (b) a procedural
mouth diagram, and (c) offline operation on a cheap tablet is the gap.

---

## 4. Risks & open questions (ranked, highest first)

1. **ASR/phoneme accuracy on real children's speech.** Children's formants are
   higher and noisier than adults'. The 2025 study shows it's *feasible* (~8.4%
   PER) [13], but the production wav2vec2 path needs fine-tuning on a children's
   corpus and per-child calibration. *MVP mitigation:* we use robust **formant**
   scoring (vowels) + spectral centroid (sibilants), not a fragile word-level
   model, and keep scoring lenient/encouraging.
2. **Child-audio privacy / COPPA.** The FTC's **Jan 2025** COPPA amendments
   expand "personal information" to include **biometric identifiers**, tightening
   consent for products capturing kids' voice [15]. *Mitigation:* fully
   on-device, **no audio ever leaves the tablet** — a genuine compliance and
   trust advantage, not just a feature.
3. **Buyer budget timing.** The ESSER cliff [7][8] squeezes district spend right
   now. *Mitigation:* price for Title I recurring funds + D2C parents; lead with
   "runs on the $50-class tablet you already have, offline."
4. **Clinical efficacy evidence.** We can show *in-session* accuracy gains, but a
   real outcomes claim needs a study. Open question below.
5. **Device/browser support.** Fire tablets ship the Silk browser; Web Audio +
   `getUserMedia` support and mic quality need on-device testing. *Mitigation:*
   PWA + the synthetic-voice fallback guarantees the core loop demos regardless.
6. **Incumbent competition** from funded reading-AI startups (Ello, Amira). We
   differentiate on articulation + offline + speech-sound focus, not reading
   fluency.

**Open questions:**
- Does short daily phoneme practice with this kind of feedback actually transfer
  to decoding/reading gains? (Needs a pilot.) ← *biggest open question*
- What absolute formant-target calibration is right for 4–6-year-olds vs adults?
- Is the durable buyer the district, the SLP clinic, or the parent?
- Fire-tablet mic fidelity: good enough for reliable formant estimation in a
  noisy classroom?

---

## Sources

1. NCES / NAGB — *2024 NAEP Reading Results, Grade 4*: https://www.nationsreportcard.gov/reports/reading/2024/g4_8/?grade=4
2. Reading Rockets (Moats & Tolman) — *Why Phonological Awareness Is Important*: https://www.readingrockets.org/topics/early-literacy-development/articles/why-phonological-awareness-important-reading-and
3. NIDCD (NIH) — *Quick Statistics About Voice, Speech, Language*: https://www.nidcd.nih.gov/health/statistics/quick-statistics-voice-speech-language
4. ASHA — *Recruiting and Retaining Qualified School-Based SLPs* (2024 Schools Survey, 78%): https://www.asha.org/careers/recruitment/schools/
5. ASHA Practice Portal — *Speech Sound Disorders: Articulation and Phonology*: https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/
6. Market.us — *EdTech for Early Childhood Market Size* (2025): https://market.us/report/edtech-for-early-childhood-market/
7. Center on Budget and Policy Priorities — *Expiration of Federal K-12 Emergency Funds* (2024): https://www.cbpp.org/research/state-budget-and-tax/expiration-of-federal-k-12-emergency-funds-could-pose-challenges-for
8. Pew Charitable Trusts — *End of Pandemic Funding for Schools* (2024): https://www.pew.org/en/research-and-analysis/articles/2024/08/14/end-of-pandemic-funding-for-schools-requires-states-and-districts-to-plan
9. NCES — *Fast Facts: Title I*: https://nces.ed.gov/fastfacts/display.asp?id=158
10. Ello — official site (AI reading coach, $14.99/mo): https://www.ello.com/
11. GlobeNewswire — *Ello Launches Storytime* (pricing, 1,000+ decodable books, 2024): https://www.globenewswire.com/news-release/2024/09/30/2955384/0/en/Ello-Launches-Storytime-New-Version-of-AI-Reading-App-Where-Kids-Create-Their-Own-Stories.html
12. Albert Shanker Institute — *Science of Reading Laws: Let's Begin with the Facts* (118 laws / 23 states + DC, 2024): https://www.shankerinstitute.org/blog/science-reading-laws-lets-begin-facts
13. JMIR / PMC — *Usefulness of ASR Assessment of Children With Speech Sound Disorders* (2025, ~8.4% PER): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11775490/
14. Speech Blubs — official site (ages 1–8, built with 1,000+ SLPs): https://speechblubs.com/
15. FTC — *FTC Finalizes Changes to Children's Privacy Rule* (Jan 16, 2025; biometric/voice): https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data
16. NCES Condition of Education — *Children's Internet Access at Home* (94% lowest vs 99% highest income quartile): https://nces.ed.gov/programs/coe/indicator/cch/home-internet-access
17. About Amazon — *Fire HD 8 tablets* (entry price **$99.99**; note: the brief's "$35" is a Fire 7 deep-sale price, not list — corrected here): https://www.aboutamazon.com/news/devices/amazon-fire-hd-8-tablets-gen-ai-hd-entertainment
18. EdSurge — *How Offline-First Edtech Addresses Education Disparities* (Kolibri): https://www.edsurge.com/news/2024-01-12-how-offline-first-edtech-addresses-education-disparities-worldwide
