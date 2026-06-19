import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { StrictMode, useEffect, useState } from 'react'
import { supabase } from './supabase'
import Home from './Home'
import Dashboard from './Dashboard'
import Assetklassen from './Assetklassen'
import Haushaltsbuch from './Haushaltsbuch'
import Profil from './Profil'
import Simulation from './Simulation'
import Support from './Support'
import './index.css'
import LF from './LF'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  if (!session) return <BrowserRouter><Home /></BrowserRouter>

  return (
    <BrowserRouter>
      <nav>
        <Link to="/dashboard">Dashboard</Link> |{" "}
        <Link to="/haushaltsbuch">Haushaltsbuch</Link> |{" "}
        <Link to="/assetklassen">Assetklassen</Link> |{" "}
        <Link to="/simulation">Simulation</Link> |{" "}
        <Link to="/profil">Profil</Link> |{" "}
        <Link to="/support">Support</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assetklassen" element={<Assetklassen />}>
          <Route path='lf' element={<LF/>}/>
        </Route>
        <Route path="/haushaltsbuch" element={<Haushaltsbuch />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/support" element={<Support />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)