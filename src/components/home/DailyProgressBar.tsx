interface DailyProgressBarProps {
  taughtCount: number
  dailyGoal: number
}

export function DailyProgressBar({ taughtCount, dailyGoal }: DailyProgressBarProps) {
  const percent = Math.min(100, (taughtCount / dailyGoal) * 100)

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-sm font-bold text-forest">
        <span>Teach the dragon</span>
        <span>
          {taughtCount}/{dailyGoal} words today
        </span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-white shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-dragon-teal to-sunshine transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
