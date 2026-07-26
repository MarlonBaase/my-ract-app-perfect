import { useState } from 'react'
import { supabase } from './supabase'

export default function Home() { // Tipp: Großschreibung 'Home'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState('login')

  const [otpCode, setOtpCode] = useState('')
  const [factorId, setFactorId] = useState(null)

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return alert(error.message) // 1. Korrektur: return

    const { data: factors, error: mfaError } = await supabase.auth.mfa.listFactors()
    if (mfaError) return alert(mfaError.message)

    const totpFactor = factors.totp.find(f => f.status === 'verified')

    if (totpFactor) {
      setFactorId(totpFactor.id)
      setStep('mfa')
    } else {
      alert('Erfolgreich eingeloggt!')
    }
  }

  const verify = async () => {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: otpCode }) // 2. Korrektur: await
    if (error) {
      alert(error.message)
    } else {
      alert('2FA erfolgreich!')
    }
  }

  return (
    <div>
      <h2>Login</h2>
      {step === 'login' ? (
        <div>
          <input placeholder="E-Mail" onChange={e => setEmail(e.target.value)} />
          <input placeholder="Passwort" type="password" onChange={e => setPassword(e.target.value)} />
          <button onClick={signIn}>Einloggen</button>
        </div>
      ) : (
        <div>
          <input placeholder="Code" type="password" onChange={e => setOtpCode(e.target.value)} />
          <button onClick={verify}>Bestätigen</button>
        </div>
      )}
    </div>
  )
}