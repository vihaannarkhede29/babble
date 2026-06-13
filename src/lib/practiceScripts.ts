export const PRACTICE_DEMO_SCRIPTS: Record<string, boolean[]> = {
  cat: [true, true, true],
  sun: [true, true, true],
  fish: [true, true, true],
  frog: [true, false, true, true],
  star: [true, true, true],
  tree: [true, true, true],
  bath: [true, true, true],
}

export function getFirstAttemptPhonemeResults(
  wordId: string,
  phonemes: string[],
): { phoneme: string; correctOnFirstTry: boolean }[] {
  const script = PRACTICE_DEMO_SCRIPTS[wordId] ?? phonemes.map(() => true)
  return phonemes.map((phoneme, index) => ({
    phoneme,
    correctOnFirstTry: script[index] ?? true,
  }))
}
