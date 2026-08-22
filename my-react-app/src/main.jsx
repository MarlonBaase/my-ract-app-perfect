import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { StrictMode, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { ErrorBoundary } from 'react-error-boundary'
import { SettingsContext } from './SettingsContext';
import Home from './Home'
import Dashboard from './Dashboard'
import Assetklassen from './Assetklassen'
import Lf from './Lf'
import Wd from './Wd'
import Girokonto from './assetklassen/Girokonto'
import Tagesgeld from './assetklassen/Tagesgeld'
import Festgeld from './assetklassen/Festgeld'
import Fremdwaehrung from './assetklassen/Fremdwaehrung'
import Haushaltsbuch from './haushaltsbuch'
import Profil from './Profil'
import Konfiguration from './profil/konfiguration'
import Simulation from './Simulation'
import Support from './Support'
import Navbar from './Navbar'
import Zeiterfassung from './profil/Zeiterfassung'
import AssetSidebar from './AssetSidebar'
import './index.css'





function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div style={{ padding: "20px", border: "1px solid red", borderRadius: "8px", margin: "20px", backgroundColor: "#fff5f5" }}>
      <h2>Hoppla! Da ist etwas schiefgelaufen. 🙈</h2>
      <p style={{ color: "red" }}>{error.message}</p>
      <button onClick={resetErrorBoundary} style={{ padding: "8px 12px", cursor: "pointer" }}>
        Erneut versuchen
      </button>
    </div>
  );
}


function App() {
  const [session, setSession] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [ansicht, setAnsicht] = useState("card")

  useEffect(() => {
    const checkMfaAndSetSession = async (currentSession) => {
      if (!currentSession) {
        setSession(null);
        return;
      }

      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (mfaData && mfaData.currentLevel === mfaData.nextLevel) {
        setSession(currentSession);
      } else {
        setSession(null);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      checkMfaAndSetSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkMfaAndSetSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light"
  }, [darkMode])

  if (!session) return <BrowserRouter><Home /></BrowserRouter>

  return (
    <SettingsContext.Provider value={{ ansicht, setAnsicht }}>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          window.location.reload();
        }}
      >
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
                <Route path="fremdwaehrung" element={<Fremdwaehrung darkMode={darkMode} />} >
                  <Route path="fremdwaehrung_Stammdaten" element={<fremdwaehrung_Stammdaten darkMode={darkMode} />} />
                  <Route path="fremdwaehrung_Konto" element={<fremdwaehrung_Konto darkMode={darkMode} />} />
                </Route>
              </Route>
              <Route path='wd' element={<Wd darkMode={darkMode} />} />
            </Route>
            <Route path="/haushaltsbuch" element={<Haushaltsbuch darkMode={darkMode} />} />
            <Route path="/profil" element={<Profil darkMode={darkMode} />}>
              <Route path="konfiguration" element={<Konfiguration darkMode={darkMode} setDarkMode={setDarkMode} />} />
              <Route path="zeiterfassung" element={<Zeiterfassung darkMode={darkMode} setDarkMode={setDarkMode} />} />
            </Route>
            <Route path="/simulation" element={<Simulation darkMode={darkMode} />} />
            <Route path="/support" element={<Support darkMode={darkMode} />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </SettingsContext.Provider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)