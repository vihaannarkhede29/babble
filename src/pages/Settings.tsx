// Settings.tsx — Grown-up settings: edit the profile, set/clear the parent PIN,
// redo the diagnostic, or reset everything. Behind the parent gate.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ParentGate } from '../components/ParentGate'
import { useProfile, profileStore } from '../profile/store'
import { gameStore } from '../game/store'
import { diagnosticStore } from '../diagnostic/store'

function SettingsInner() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const [pin, setPin] = useState(profile.parentPin ?? '')
  const [saved, setSaved] = useState('')

  const flash = (msg: string) => {
    setSaved(msg)
    setTimeout(() => setSaved(''), 1800)
  }

  return (
    <div className="settings">
      <h1 className="settings-title">Settings</h1>

      <section className="panel">
        <h3>Profile</h3>
        <label className="field">
          <span className="field-label">Child's name</span>
          <input
            className="field-input"
            value={profile.childName}
            maxLength={24}
            onChange={(e) => profileStore.update({ childName: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field-label">Dragon's name</span>
          <input
            className="field-input"
            value={profile.dragonName}
            maxLength={16}
            onChange={(e) => profileStore.update({ dragonName: e.target.value })}
          />
        </label>
      </section>

      <section className="panel">
        <h3>Parent PIN</h3>
        <p className="panel-note">A 4-digit PIN gates this dashboard. Leave blank to remove it.</p>
        <div className="settings-row">
          <input
            className="field-input field-input--pin"
            inputMode="numeric"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <button
            className="btn-teal btn-pressable"
            onClick={() => {
              profileStore.setPin(pin.length === 4 ? pin : null)
              flash(pin.length === 4 ? 'PIN saved' : 'PIN removed')
            }}
          >
            Save PIN
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>Diagnostic</h3>
        <p className="panel-note">
          {profile.diagnosticComplete
            ? 'The first-words screen is complete. You can run it again any time.'
            : 'The first-words screen has not been completed yet.'}
        </p>
        <button
          className="btn-coral btn-pressable"
          onClick={() => {
            diagnosticStore.reset()
            profileStore.update({ diagnosticComplete: false })
            navigate('/teach-blaze')
          }}
        >
          Redo the first-words screen
        </button>
      </section>

      <section className="panel">
        <h3>Reset</h3>
        <div className="settings-row">
          <button className="reset-btn" onClick={() => { gameStore.reset(); flash('Practice data reset') }}>
            Reset practice data
          </button>
          <button
            className="reset-btn"
            onClick={() => {
              gameStore.reset()
              diagnosticStore.reset()
              profileStore.reset()
              navigate('/onboarding')
            }}
          >
            Reset everything
          </button>
        </div>
      </section>

      {saved && <div className="settings-flash">{saved}</div>}
    </div>
  )
}

export function Settings() {
  return (
    <ParentGate title="Settings">
      <SettingsInner />
    </ParentGate>
  )
}
