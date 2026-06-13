import { motion } from 'framer-motion'
import type { PathNodeItem } from '../../lib/learnPath'
import { WordIllustration } from '../words/WordIllustration'

interface PathNodeButtonProps {
  node: PathNodeItem
  onSelect: (wordId: string) => void
}

function NodeIcon({ node }: { node: PathNodeItem }) {
  if (node.kind === 'chest') {
    return <span className="text-2xl">{node.state === 'completed' ? '🎁' : '🔒'}</span>
  }
  if (node.kind === 'trophy') {
    return <span className="text-2xl">{node.state === 'completed' ? '🏆' : '🔒'}</span>
  }

  if (node.state === 'completed') {
    return <span className="text-2xl">⭐</span>
  }

  if (node.word) {
    return (
      <WordIllustration image={node.word.image} className="h-10 w-12" />
    )
  }

  return <span className="text-xl font-black">?</span>
}

export function PathNodeButton({ node, onSelect }: PathNodeButtonProps) {
  const isInteractive =
    node.kind === 'word' && (node.state === 'current' || node.state === 'available' || node.state === 'completed')
  const isCurrent = node.state === 'current'

  const ringClass =
    node.state === 'completed'
      ? 'bg-sunshine border-sunshine shadow-[0_6px_0_#e6b84d]'
      : isCurrent
        ? 'bg-dragon-teal border-dragon-teal shadow-[0_6px_0_#2a9999] ring-4 ring-dragon-teal/30'
        : node.state === 'available'
          ? 'bg-white border-dragon-teal shadow-[0_6px_0_#2a9999]'
          : node.state === 'later'
            ? 'bg-forest/5 border-forest/15 shadow-[0_4px_0_#d4d0c8] opacity-60'
            : 'bg-[#e8e8e8] border-[#d0d0d0] shadow-[0_4px_0_#c8c8c8]'

  const content = (
    <div className="relative flex flex-col items-center">
      {isCurrent && (
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="mb-2 rounded-lg bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-dragon-teal shadow-md"
        >
          Start
        </motion.span>
      )}
      {node.state === 'later' && node.word && (
        <span className="mb-1 text-[10px] font-bold uppercase text-forest/40">Later</span>
      )}
      <motion.div
        whileHover={isInteractive ? { scale: 1.08 } : undefined}
        whileTap={isInteractive ? { scale: 0.95 } : undefined}
        className={[
          'flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 transition-transform',
          ringClass,
          isInteractive ? 'cursor-pointer' : 'cursor-default',
        ].join(' ')}
      >
        <NodeIcon node={node} />
      </motion.div>
      {node.word && node.kind === 'word' && (
        <span
          className={[
            'mt-2 text-sm font-black tracking-wide',
            node.state === 'locked' || node.state === 'later' ? 'text-forest/35' : 'text-forest',
          ].join(' ')}
        >
          {node.word.label}
        </span>
      )}
    </div>
  )

  if (isInteractive && node.word) {
    return (
      <button type="button" className="border-0 bg-transparent p-0" onClick={() => onSelect(node.word!.id)}>
        {content}
      </button>
    )
  }

  return content
}

interface LearningPathProps {
  nodes: PathNodeItem[]
  onSelectWord: (wordId: string) => void
}

export function LearningPath({ nodes, onSelectWord }: LearningPathProps) {
  return (
    <div className="relative mx-auto flex max-w-sm flex-col items-center py-4">
      {nodes.map((node, index) => {
        const showConnector = index > 0

        return (
          <div
            key={node.id}
            className="relative flex w-full flex-col items-center"
            style={{ transform: `translateX(${node.offsetX}px)` }}
          >
            {showConnector && (
              <div
                className={[
                  'mb-1 h-10 w-1 rounded-full',
                  node.state === 'locked' || node.state === 'later'
                    ? 'bg-forest/10'
                    : 'bg-dragon-teal/40',
                ].join(' ')}
              />
            )}
            <PathNodeButton node={node} onSelect={onSelectWord} />
            <div className="h-4" />
          </div>
        )
      })}
    </div>
  )
}
