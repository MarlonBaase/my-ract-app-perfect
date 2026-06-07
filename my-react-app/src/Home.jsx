import { useState } from 'react'
import { supabase } from './supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  return (
    <div>
      <h2>Login</h2>
      <input placeholder="E-Mail" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Passwort" type="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={signIn}>Einloggen</button>
    </div>
  )
}