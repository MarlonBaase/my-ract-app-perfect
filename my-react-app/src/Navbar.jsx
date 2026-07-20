import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const navStruktur = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    unterseiten: [
      { label: 'Aktuelle Gesamtzahlen', path: '/dashboard/gesamtzahlen' },
      { label: 'Diagramme', path: '/dashboard/diagramme' },
      { label: 'Watchlist', path: '/dashboard/watchlist' },
    ]
  },
  {
    label: 'Haushaltsbuch',
    path: '/haushaltsbuch',
    unterseiten: [
      { label: 'Geldfluss', path: '/haushaltsbuch/geldfluss' },
      { label: 'Aktuelle Zahlen', path: '/haushaltsbuch/zahlen' },
      { label: 'Diagramme', path: '/haushaltsbuch/diagramme' },
    ]
  },
  {
    label: 'Assetklassen',
    path: '/assetklassen',
    unterseiten: []
  },
  {
    label: 'Steuern & Risiko',
    path: '/steuern',
    unterseiten: [
      { label: 'Steuerverwaltung', path: '/steuern/verwaltung' },
      { label: 'Risikobewertung', path: '/steuern/risiko' },
    ]
  },
  {
    label: 'Simulation & Berechnung',
    path: '/simulation',
    unterseiten: [
      { label: 'Gesamtsimulationen', path: '/simulation/gesamt' },
      { label: 'Allgemeine Berechnungen', path: '/simulation/berechnungen' },
    ]
  },
  {
    label: 'Support',
    path: '/support',
    unterseiten: []
  },
  {
    label: 'Profil',
    path: '/profil',
    unterseiten: [
      { label: 'Einstellungen', path: '/profil/einstellungen' },
      { label: 'Konfiguration', path: '/profil/konfiguration' },
    ]
  },
]

export default function Navbar({ darkMode }) {
  const location = useLocation()
  const [offenIndex, setOffenIndex] = useState(null)
  const [mobileMenuOffen, setMobileMenuOffen] = useState(false)

  const istAktiv = (path) => location.pathname.startsWith(path)

  const toggleDropdown = (index) => {
    setOffenIndex(offenIndex === index ? null : index)
  }

  return (
    <nav style={{
      backgroundColor: darkMode ? '#1e1e2e' : '#ffffff',
      borderBottom: darkMode ? '1px solid #333' : '1px solid #e0e0e0',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {/* HEADER LEISTE */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
      }}>
        <div style={{ fontWeight: '700', fontSize: '1.1rem', color: darkMode ? '#ffffff' : '#0f1117' }}>
          Mein Portfolio
        </div>

        {/* Hamburger Button für Mobilgeräte */}
        <button
          onClick={() => setMobileMenuOffen(!mobileMenuOffen)}
          style={{
            display: 'block',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: darkMode ? '#ffffff' : '#374151',
          }}
        >
          {mobileMenuOffen ? '✕' : '☰'}
        </button>
      </div>

      {/* MENÜLISTE (Aufklappbar auf dem Handy) */}
      <div style={{
        display: mobileMenuOffen ? 'block' : 'none',
        paddingBottom: '1rem',
        maxHeight: 'calc(100vh - 60px)',
        overflowY: 'auto'
      }}>
        {navStruktur.map((item, index) => (
          <div key={index} style={{ borderBottom: darkMode ? '1px solid #2d3142' : '1px solid #f0f0f0' }}>
            
            {/* Hauptlink & Pfeil */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link
                to={item.path}
                onClick={() => {
                  if (item.unterseiten.length === 0) setMobileMenuOffen(false)
                }}
                style={{
                  display: 'block',
                  padding: '0.75rem 0',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: istAktiv(item.path) ? '600' : '400',
                  color: istAktiv(item.path)
                    ? '#4f8ef7'
                    : darkMode ? '#c9d1e0' : '#374151',
                }}
              >
                {item.label}
              </Link>

              {item.unterseiten.length > 0 && (
                <button
                  onClick={() => toggleDropdown(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.75rem',
                    color: darkMode ? '#c9d1e0' : '#374151',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {offenIndex === index ? '▲' : '▼'}
                </button>
              )}
            </div>

            {/* Unterseiten (Dropdown) */}
            {item.unterseiten.length > 0 && offenIndex === index && (
              <div style={{
                backgroundColor: darkMode ? '#161925' : '#f8f9fc',
                borderRadius: '6px',
                padding: '0.5rem 0',
                marginBottom: '0.5rem'
              }}>
                {item.unterseiten.map((unter, uIndex) => (
                  <Link
                    key={uIndex}
                    to={unter.path}
                    onClick={() => setMobileMenuOffen(false)}
                    style={{
                      display: 'block',
                      padding: '0.5rem 1rem',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      color: istAktiv(unter.path)
                        ? '#4f8ef7'
                        : darkMode ? '#a0aec0' : '#4a5568',
                      fontWeight: istAktiv(unter.path) ? '600' : '400',
                    }}
                  >
                    {unter.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}