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

  const istAktiv = (path) => location.pathname.startsWith(path)

  return (
    <nav style={{
      backgroundColor: darkMode ? '#1e1e2e' : '#ffffff',
      borderBottom: darkMode ? '1px solid #333' : '1px solid #e0e0e0',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      gap: '0.25rem',
    }}>
      {navStruktur.map((item, index) => (
        <div
          key={index}
          style={{ position: 'relative' }}
          onMouseEnter={() => setOffenIndex(index)}
          onMouseLeave={() => setOffenIndex(null)}
        >
          {/* Hauptmenüpunkt */}
          <Link
            to={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 0.75rem',
              height: '56px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: istAktiv(item.path) ? '600' : '400',
              color: istAktiv(item.path)
                ? '#4f8ef7'
                : darkMode ? '#c9d1e0' : '#374151',
              borderBottom: istAktiv(item.path)
                ? '2px solid #4f8ef7'
                : '2px solid transparent',
              transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
            {item.unterseiten.length > 0 && (
              <span style={{ marginLeft: '4px', fontSize: '0.6rem', opacity: 0.6 }}>▼</span>
            )}
          </Link>

          {/* Dropdown */}
          {item.unterseiten.length > 0 && offenIndex === index && (
            <div style={{
              position: 'absolute',
              top: '56px',
              left: 0,
              backgroundColor: darkMode ? '#2a2a3e' : '#ffffff',
              border: darkMode ? '1px solid #444' : '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              minWidth: '220px',
              zIndex: 1001,
              overflow: 'hidden',
            }}>
              {item.unterseiten.map((unter, uIndex) => (
                <Link
                  key={uIndex}
                  to={unter.path}
                  style={{
                    display: 'block',
                    padding: '0.6rem 1rem',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    color: istAktiv(unter.path)
                      ? '#4f8ef7'
                      : darkMode ? '#c9d1e0' : '#374151',
                    backgroundColor: istAktiv(unter.path)
                      ? darkMode ? '#1a1a2e' : '#f0f5ff'
                      : 'transparent',
                    fontWeight: istAktiv(unter.path) ? '600' : '400',
                    borderLeft: istAktiv(unter.path) ? '3px solid #4f8ef7' : '3px solid transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (!istAktiv(unter.path)) {
                      e.currentTarget.style.backgroundColor = darkMode ? '#333350' : '#f5f7ff'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!istAktiv(unter.path)) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {unter.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
