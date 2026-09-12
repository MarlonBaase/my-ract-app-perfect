import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_STRUKTUR, checkIsActive } from './services/fremd_navbarService';

export default function FremdNavbar({ darkMode = false }) {
  const location = useLocation();
  const [offenIndex, setOffenIndex] = useState(null);

  return (
    <nav
      style={{
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
      }}
    >
      {NAV_STRUKTUR.map((item, index) => {
        const aktiv = checkIsActive(location.pathname, item.path);

        return (
          <div
            key={item.path || index}
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
                fontWeight: aktiv ? '600' : '400',
                color: aktiv
                  ? '#4f8ef7'
                  : darkMode ? '#c9d1e0' : '#374151',
                borderBottom: aktiv
                  ? '2px solid #4f8ef7'
                  : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}