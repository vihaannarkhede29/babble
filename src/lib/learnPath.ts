import type { Word } from './words'

export type PathNodeKind = 'word' | 'chest' | 'trophy'
export type PathNodeState = 'current' | 'completed' | 'available' | 'locked' | 'later'

export interface PathNodeItem {
  id: string
  kind: PathNodeKind
  word?: Word
  state: PathNodeState
  offsetX: number
}

export function buildLearningPath(
  recommended: Word[],
  deprioritized: Word[],
  getStatus: (wordId: string) => 'mastered' | 'in-progress' | 'not-started',
): PathNodeItem[] {
  const nodes: PathNodeItem[] = []
  let foundCurrent = false
  const offsets = [0, 48, -48, 48, -48, 0, 48, -48]

  recommended.forEach((word, index) => {
    const status = getStatus(word.id)
    let state: PathNodeState

    if (status === 'mastered') {
      state = 'completed'
    } else if (!foundCurrent) {
      state = 'current'
      foundCurrent = true
    } else if (status === 'in-progress') {
      state = 'available'
    } else {
      state = 'locked'
    }

    nodes.push({
      id: word.id,
      kind: 'word',
      word,
      state,
      offsetX: offsets[index % offsets.length],
    })

    if ((index + 1) % 2 === 0 && index < recommended.length - 1) {
      nodes.push({
        id: `chest-${index}`,
        kind: 'chest',
        state: state === 'completed' ? 'completed' : 'locked',
        offsetX: offsets[(index + 1) % offsets.length],
      })
    }
  })

  if (recommended.length > 0) {
    const allRecommendedMastered = recommended.every((w) => getStatus(w.id) === 'mastered')
    nodes.push({
      id: 'unit-trophy',
      kind: 'trophy',
      state: allRecommendedMastered ? 'completed' : 'locked',
      offsetX: 0,
    })
  }

  deprioritized.forEach((word, index) => {
    nodes.push({
      id: word.id,
      kind: 'word',
      word,
      state: 'later',
      offsetX: offsets[(index + recommended.length) % offsets.length],
    })
  })

  return nodes
}

export function computeSessionXp(taughtTodayCount: number): number {
  return taughtTodayCount * 25
}
