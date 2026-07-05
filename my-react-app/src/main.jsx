import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { StrictMode, useEffect, useState } from 'react'
import { supabase } from './supabase'
import Home from './Home'
import Dashboard from './Dashboard'
import Assetklassen from './Assetklassen'
import Lf from './Lf'
import Wd from './Wd'
import Girokonto from './assetklassen/Girokonto'
import Tagesgeld from './assetklassen/Tagesgeld'
import Festgeld  from './assetklassen/Festgeld'
import Haushaltsbuch from './haushaltsbuch'
import Profil from './Profil'
import Simulation from './Simulation'
import Support from './Support'
import Navbar from './Navbar'
import AssetSidebar from './AssetSidebar'
import './index.css'

function App() {
  const [session, setSession] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light"
  }, [darkMode])

  if (!session) return <BrowserRouter><Home /></BrowserRouter>

  return (
    <BrowserRouter>
      <Navbar darkMode={darkMode} />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />
        <Route path="/assetklassen" element={<Assetklassen darkMode={darkMode} />}>
          <Route path="lf" element={<Lf darkMode={darkMode} />}>
            <Route path="girokonto" element={<Girokonto darkMode={darkMode} />} />
            <Route path="tagesgeld" element={<Tagesgeld darkMode={darkMode} />} />
            <Route path="festgeld" element={<Festgeld darkMode={darkMode} />} />
          </Route>
          <Route path='wd' element={<Wd darkMode={darkMode}/>} />
        </Route>
        <Route path="/haushaltsbuch" element={<Haushaltsbuch darkMode={darkMode} />} />
        <Route path="/profil" element={<Profil darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/simulation" element={<Simulation darkMode={darkMode} />} />
        <Route path="/support" element={<Support darkMode={darkMode} />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)