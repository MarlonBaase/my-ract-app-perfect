import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const navStruktur = [
  {
    label: 'Währungsstammdaten',
    path: '/assetklassen/lf/fremdwaehrung_Stammdaten',
    unterseiten: []
  },
  {
    label: 'Fremdwährungskonto',
    path: '/assetklassen/lf/fremdwaehrung_konto',
    unterseiten: []
  }

]

export default function Navbar({ darkMode }) {
  const location = useLocation()
  const [offenIndex, setOffenIndex] = useState(null)

  const istAktiv = (path) => location.pathname.startsWith(path)

  return (
    <nav style={{
      backgroundColor: darkMode ? '#1e1e2e' : '#ffffff',
      borderBottom: darkMode ? '1px solid #333' : '1px solid #e0e0e0',
      padding: '0 1rem',
      display: 'flex',
      alignItems: 'center',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      gap: '0.25rem',
      maxWidth: '100vw',
      overflowX: 'auto', // Macht die Leiste am Handy wischbar
      whiteSpace: 'nowrap'
    }}>
      {navStruktur.map((item, index) => (
        <div
          key={index}
          style={{ position: 'relative', flexShrink: 0 }}
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
          </Link>
        </div>
      ))}
    </nav>
  )
}