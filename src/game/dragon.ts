// dragon.ts — "Sparky" the companion dragon's dialogue.
//
// The brief proposed a local LLM (Phi-3 via Ollama) for encouragement. For an
// offline PWA that must boot on a $35 Fire tablet, a multi-GB model is the
// wrong tool: it's slow, huge, and non-deterministic. Instead this is a small,
// deterministic dialogue engine — instant, tiny, and crucially it lets us
// guarantee the *tone* that makes the product work:
//
//   Sparky learns the sounds ALONGSIDE the child and gets them wrong too, so a
//   missed attempt reads as "we're figuring this out together," never failure.
//
// (The LLM remains a drop-in upgrade for the production roadmap — see DECISIONS.)

export type DragonEvent =
  | 'greet'
  | 'listening'
  | 'success' // >= 85
  | 'close' // 60–84
  | 'struggle' // < 60
  | 'levelUp'

export interface DragonContext {
  event: DragonEvent
  /** Friendly label of the current sound, e.g. "EE". */
  sound?: string
  /** A coaching hint from the scorer, if any. */
  hint?: string
  /** Rotating index so repeated events vary without randomness-per-frame. */
  nonce?: number
}

const LINES: Record<DragonEvent, string[]> = {
  greet: [
    "Hi! I'm Sparky. Let's learn some sounds together! 🐲",
    "Roar! Ready to make some sounds with me? 🐲",
  ],
  listening: ["I'm listening… your turn! 👂", 'Make the sound — I want to try too!'],
  success: [
    'YES! You nailed it — and so did I! 🔥',
    "Whoa, perfect! We're a great team! ⭐",
    'That was beautiful! High five! 🙌',
  ],
  close: [
    "So close! Let's both try once more. 💪",
    'Almost! Tweak it a tiny bit — I will too.',
    'Good try! Nudge it like this:',
  ],
  struggle: [
    "Oof, that one's tricky for me too! Try again with me. 🐲",
    "This sound is sneaky. We'll get it together!",
    'No worries — even dragons need practice. Again!',
  ],
  levelUp: ['LEVEL UP! 🎉 We grew stronger together!', 'New level! Our sound-magic is growing! ✨'],
}

/** Pick a deterministic line for an event (varies with `nonce`). */
export function dragonLine(ctx: DragonContext): string {
  const pool = LINES[ctx.event]
  const base = pool[(ctx.nonce ?? 0) % pool.length]
  // For "close" attempts, attach the concrete coaching hint when we have one.
  if (ctx.event === 'close' && ctx.hint) return `${base} ${ctx.hint}`
  return base
}

/** Map a 0..100 score to the right reaction event. */
export function eventForScore(score: number): DragonEvent {
  if (score >= 85) return 'success'
  if (score >= 60) return 'close'
  return 'struggle'
}
