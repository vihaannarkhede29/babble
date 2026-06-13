import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { id: 'learn', label: 'Learn', icon: '🏠', to: '/' },
  { id: 'progress', label: 'Progress', icon: '📊', to: '/dashboard' },
  { id: 'settings', label: 'Settings', icon: '⚙️', to: '/settings' },
]

export function LearnNav() {
  const location = useLocation()

  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-forest/10 bg-white py-6 lg:flex">
        <div className="px-6 pb-8">
          <span className="text-2xl font-black tracking-tight text-dragon-teal">PhonicsForge</span>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const active = location.pathname === item.to
            return (
              <Link
                key={item.id}
                to={item.to}
                className={[
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors',
                  active
                    ? 'bg-dragon-teal/15 text-dragon-teal'
                    : 'text-forest/60 hover:bg-cloud hover:text-forest',
                ].join(' ')}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-forest/10 bg-white px-2 py-2 lg:hidden">
        {navItems.map((item) => {
          const active = location.pathname === item.to
          return (
            <Link
              key={item.id}
              to={item.to}
              className={[
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold',
                active ? 'text-dragon-teal' : 'text-forest/50',
              ].join(' ')}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export function LearnStatsBar({
  xp,
  streak,
  wordsToday,
  dailyGoal,
  sessionMinutes,
}: {
  xp: number
  streak: number
  wordsToday: number
  dailyGoal: number
  sessionMinutes: number
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
      {[
        { icon: '⚡', value: xp, label: 'XP', color: 'text-sunshine' },
        { icon: '🔥', value: streak, label: 'day streak', color: 'text-coral' },
        { icon: '📖', value: `${wordsToday}/${dailyGoal}`, label: 'words', color: 'text-dragon-teal' },
        { icon: '⏱️', value: sessionMinutes, label: 'min goal', color: 'text-forest/70' },
      ].map((stat) => (
        <motion.div
          key={stat.label}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"
        >
          <span className="text-base">{stat.icon}</span>
          <span className={`text-sm font-black ${stat.color}`}>{stat.value}</span>
        </motion.div>
      ))}
    </div>
  )
}
