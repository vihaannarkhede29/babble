import { Link, useNavigate } from 'react-router-dom'
import { ProfileFormFields } from '../components/onboarding/ProfileFormFields'
import { useChildProfile } from '../hooks/useChildProfile'
import { DEFAULT_DRAGON_NAME } from '../lib/profile'

export function SettingsPage() {
  const navigate = useNavigate()
  const { profile, updateProfile } = useChildProfile()

  const handleSave = () => {
    updateProfile({
      childName: profile.childName.trim(),
      dragonName: profile.dragonName.trim() || DEFAULT_DRAGON_NAME,
      onboardingComplete: profile.childName.trim().length > 0,
    })
    navigate('/')
  }

  return (
    <div className="mx-auto min-h-svh max-w-md px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-forest">Settings</h1>
          <p className="text-sm font-semibold text-forest/70">Update your child&apos;s profile</p>
        </div>
        <Link
          to="/"
          className="btn-pressable rounded-full bg-white px-4 py-2 text-sm font-bold text-forest shadow-md"
        >
          Cancel
        </Link>
      </header>

      <div className="card-tactile p-5">
        <ProfileFormFields profile={profile} onChange={updateProfile} showNameFields />
      </div>

      <button
        type="button"
        disabled={profile.childName.trim().length === 0}
        className={[
          'btn-pressable mt-6 w-full rounded-xl py-4 font-black shadow-md',
          profile.childName.trim().length > 0
            ? 'bg-forest text-cloud'
            : 'cursor-not-allowed bg-forest/30 text-cloud/70',
        ].join(' ')}
        onClick={handleSave}
      >
        Save changes
      </button>
    </div>
  )
}
