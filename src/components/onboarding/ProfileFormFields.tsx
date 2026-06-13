import {
  AGE_MAX,
  AGE_MIN,
  AGE_QUICK_PICKS,
  CHALLENGING_SOUND_OPTIONS,
  SESSION_LENGTH_OPTIONS,
  SESSION_MAX_MINUTES,
  SESSION_MIN_MINUTES,
  clampAge,
  clampSessionMinutes,
  type ChildProfile,
} from '../../lib/profile'

interface ProfileFormFieldsProps {
  profile: ChildProfile
  onChange: (updates: Partial<ChildProfile>) => void
  showNameFields?: boolean
  showAge?: boolean
  showSounds?: boolean
  showSession?: boolean
}

export function ProfileFormFields({
  profile,
  onChange,
  showNameFields = true,
  showAge = true,
  showSounds = true,
  showSession = true,
}: ProfileFormFieldsProps) {
  const toggleSound = (sound: string) => {
    const next = profile.challengingSounds.includes(sound)
      ? profile.challengingSounds.filter((s) => s !== sound)
      : [...profile.challengingSounds, sound]
    onChange({ challengingSounds: next })
  }

  return (
    <div className="flex flex-col gap-6">
      {showNameFields && (
        <>
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-bold text-forest">Child&apos;s name</span>
            <input
              type="text"
              value={profile.childName}
              onChange={(e) => onChange({ childName: e.target.value })}
              placeholder="Maya"
              className="rounded-xl border-2 border-forest/15 bg-white px-4 py-3 text-lg font-semibold text-forest outline-none focus:border-dragon-teal"
            />
          </label>

          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-bold text-forest">Dragon&apos;s name</span>
            <input
              type="text"
              value={profile.dragonName}
              onChange={(e) => onChange({ dragonName: e.target.value })}
              placeholder="Blaze"
              className="rounded-xl border-2 border-forest/15 bg-white px-4 py-3 text-lg font-semibold text-forest outline-none focus:border-dragon-teal"
            />
          </label>
        </>
      )}

      {showAge && (
      <fieldset className="flex flex-col gap-3 text-left">
        <legend className="text-sm font-bold text-forest">How old is your child?</legend>
        <div className="flex flex-wrap gap-2">
          {AGE_QUICK_PICKS.map((age) => (
            <button
              key={age}
              type="button"
              className={[
                'btn-pressable min-w-12 rounded-xl px-3 py-2.5 text-base font-black shadow-md',
                profile.age === age
                  ? 'bg-dragon-teal text-white'
                  : 'bg-white text-forest',
              ].join(' ')}
              onClick={() => onChange({ age })}
            >
              {age}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-forest/60">Or type their age</span>
          <input
            type="number"
            min={AGE_MIN}
            max={AGE_MAX}
            inputMode="numeric"
            value={profile.age}
            onChange={(e) => {
              const parsed = Number(e.target.value)
              if (Number.isNaN(parsed)) return
              onChange({ age: clampAge(parsed) })
            }}
            className="rounded-xl border-2 border-forest/15 bg-white px-4 py-3 text-lg font-semibold text-forest outline-none focus:border-dragon-teal"
          />
        </label>
      </fieldset>
      )}

      {showSounds && (
      <>
      <fieldset className="flex flex-col gap-3 text-left">
        <legend className="text-sm font-bold text-forest">
          Has a speech therapist identified any specific sounds?
        </legend>
        <div className="flex gap-2">
          {[
            { value: true, label: 'Yes' },
            { value: false, label: 'Not yet' },
          ].map(({ value, label }) => (
            <button
              key={label}
              type="button"
              className={[
                'btn-pressable flex-1 rounded-xl py-3 font-bold shadow-md',
                profile.hasIdentifiedSounds === value
                  ? 'bg-dragon-teal text-white'
                  : 'bg-white text-forest',
              ].join(' ')}
              onClick={() =>
                onChange({
                  hasIdentifiedSounds: value,
                  challengingSounds: value ? profile.challengingSounds : [],
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {profile.hasIdentifiedSounds && (
        <fieldset className="flex flex-col gap-3 text-left">
          <legend className="text-sm font-bold text-forest">
            Which sounds need extra practice?
          </legend>
          <div className="flex flex-wrap gap-2">
            {CHALLENGING_SOUND_OPTIONS.map((sound) => {
              const selected = profile.challengingSounds.includes(sound)
              return (
                <button
                  key={sound}
                  type="button"
                  className={[
                    'btn-pressable rounded-full px-4 py-2 text-sm font-black shadow-md',
                    selected ? 'bg-coral text-white' : 'bg-white text-forest',
                  ].join(' ')}
                  onClick={() => toggleSound(sound)}
                >
                  {sound}
                </button>
              )
            })}
          </div>
          <p className="text-xs font-semibold text-forest/60">
            Words heavy in these sounds will appear later, after easier words build confidence.
          </p>
        </fieldset>
      )}
      </>
      )}

      {showSession && (
      <fieldset className="flex flex-col gap-3 text-left">
        <legend className="text-sm font-bold text-forest">
          How long should practice sessions be?
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {SESSION_LENGTH_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={[
                'btn-pressable rounded-xl py-3 font-bold shadow-md',
                profile.sessionLengthMinutes === value
                  ? 'bg-sunshine text-forest'
                  : 'bg-white text-forest',
              ].join(' ')}
              onClick={() => onChange({ sessionLengthMinutes: value })}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-forest/60">
            Or type minutes ({SESSION_MIN_MINUTES}–{SESSION_MAX_MINUTES})
          </span>
          <input
            type="number"
            min={SESSION_MIN_MINUTES}
            max={SESSION_MAX_MINUTES}
            inputMode="numeric"
            value={profile.sessionLengthMinutes}
            onChange={(e) => {
              const parsed = Number(e.target.value)
              if (Number.isNaN(parsed)) return
              onChange({ sessionLengthMinutes: clampSessionMinutes(parsed) })
            }}
            className="rounded-xl border-2 border-forest/15 bg-white px-4 py-3 text-lg font-semibold text-forest outline-none focus:border-dragon-teal"
          />
        </label>
      </fieldset>
      )}
    </div>
  )
}
