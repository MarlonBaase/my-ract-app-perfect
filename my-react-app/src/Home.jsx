import { useState } from 'react'
import { supabase } from './supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState('login')
  const [otpCode, setOtpCode] = useState('')
  const [factorId, setFactorId] = useState(null)
  const [loading, setLoading] = useState(false)

  const signIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      return alert(error.message)
    }

    const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (mfaError) {
      setLoading(false)
      return alert(mfaError.message)
    }

    if (mfaData.nextLevel === 'aal2' && mfaData.nextLevel !== mfaData.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.find(f => f.status === 'verified')

      if (totpFactor) {
        setFactorId(totpFactor.id)
        setStep('mfa')
        setLoading(false)
        return
      }
    }
    setLoading(false)
    alert("Erfolgreich eingeloggt!")
  }

  const verify = async () => {
    setLoading(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: otpCode })
    setLoading(false)
    if (error) {
      alert(error.message)
    } else {
      alert('2FA erfolgreich!')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            {step === 'login' ? '🔐' : '🛡️'}
          </div>
          <h2 className="login-title">
            {step === 'login' ? 'Willkommen zurück' : '2FA-Bestätigung'}
          </h2>
          <p className="login-subtitle">
            {step === 'login' 
              ? 'Melde dich an, um auf dein Konto zuzugreifen.' 
              : 'Gib den 6-stelligen Code aus deiner Authenticator-App ein.'}
          </p>
        </div>

        {step === 'login' ? (
          <div className="login-form">
            <div className="input-group">
              <label className="input-label">E-Mail-Adresse</label>
              <input 
                placeholder="name@beispiel.de" 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)} 
                className="login-input"
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Passwort</label>
              <input 
                placeholder="••••••••" 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)} 
                className="login-input"
              />
            </div>

            <button 
              onClick={signIn} 
              disabled={loading} 
              className="login-button"
            >
              {loading ? 'Anmelden...' : 'Einloggen'}
            </button>
          </div>
        ) : (
          <div className="login-form">
            <div className="input-group">
              <label className="input-label">Sicherheitscode</label>
              <input 
                placeholder="123456" 
                type="text" 
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)} 
                className="login-input otp-input"
              />
            </div>

            <button 
              onClick={verify} 
              disabled={loading} 
              className="login-button"
            >
              {loading ? 'Prüfen...' : 'Code Bestätigen'}
            </button>
            
            <button 
              onClick={() => setStep('login')} 
              className="back-button"
            >
              ← Zurück zum Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}