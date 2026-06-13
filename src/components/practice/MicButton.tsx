import { motion } from 'framer-motion'

interface MicButtonProps {
  isRecording: boolean
  disabled?: boolean
  onPressStart: () => void
  onPressEnd: () => void
}

export function MicButton({
  isRecording,
  disabled = false,
  onPressStart,
  onPressEnd,
}: MicButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <motion.div
          className="absolute h-28 w-28 rounded-full bg-dragon-teal/30"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      )}
      <motion.button
        type="button"
        disabled={disabled}
        className={[
          'btn-pressable relative flex h-24 w-24 items-center justify-center rounded-full text-3xl shadow-lg',
          isRecording
            ? 'bg-dragon-teal text-white shadow-dragon-teal/40'
            : 'bg-coral text-white shadow-coral/40',
          disabled && 'cursor-not-allowed opacity-50',
        ]
          .filter(Boolean)
          .join(' ')}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        onPointerDown={(event) => {
          event.preventDefault()
          if (!disabled) onPressStart()
        }}
        onPointerUp={() => {
          if (!disabled) onPressEnd()
        }}
        onPointerLeave={() => {
          if (isRecording && !disabled) onPressEnd()
        }}
        aria-label={isRecording ? 'Release to finish speaking' : 'Hold to speak'}
      >
        🎤
      </motion.button>
      <p className="absolute -bottom-8 whitespace-nowrap text-sm font-bold text-forest/70">
        {isRecording ? 'Listening…' : 'Hold to speak'}
      </p>
    </div>
  )
}
