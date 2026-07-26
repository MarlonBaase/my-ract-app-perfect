import { useState } from 'react'
import { supabase } from './supabase'

export default function Home() { 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState('login')

  const [otpCode, setOtpCode] = useState('')
  const [factorId, setFactorId] = useState(null)

  const signIn = async () => {
  
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

 
  const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (mfaError) return alert(mfaError.message);

 
  if (mfaData.nextLevel === 'aal2' && mfaData.nextLevel !== mfaData.currentLevel) {
    
    
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) return alert(factorsError.message);

    const totpFactor = factors.totp.find(f => f.status === 'verified');

    if (totpFactor) {
      setFactorId(totpFactor.id);
      setStep('mfa'); 
      return;
    }
  }

  // Wenn kein 2FA aktiv ist:
  alert("Erfolgreich eingeloggt!");
};

  const verify = async () => {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: otpCode }) 
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