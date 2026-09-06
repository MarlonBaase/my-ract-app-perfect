import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
 
const struktur = [
  {
    block: "Profil",
    farbe: "#22C55E",
    bereiche: [
      {
        label: "Daten",
        path: "/profil/daten",
        unterseiten: [
        ]
      },
    ]
  },
  {
    block: "Einstellungen",
    farbe: "#c54522",
    bereiche: [
      {
        label: "Einstellungen",
        path: "/profil/konfiguration",
        unterseiten: [
        ]
      },
    ]
  },
  {
    block: "Zeiterfassung",
    farbe: "#2e2bc0",
    bereiche: [
      {
        label: "Zeiterfassung",
        path: "/profil/zeiterfassung",
        unterseiten: [
        ]
      },
    ]
  },
  {
    block: "Admin-Support",
    farbe: "#c02ba5",
    bereiche: [
      {
        label: "Admin-Support",
        path: "/profil/admin-support",
        unterseiten: [
        ]
      },
    ]
  }
]
 
export default function ProfilSidebar({ darkMode: dark }) {
  const location = useLocation()
  const [offen, setOffen] = useState({})
 
  const istAktiv = (path) => location.pathname === path
  const istBereichAktiv = (path) => location.pathname.startsWith(path)
 
  const toggleBereich = (label) => {
    setOffen(prev => ({ ...prev, [label]: !prev[label] }))
  }
 
  // Sidebar nur im Profil-Bereich anzeigen
  if (!location.pathname.startsWith("/profil")) return null
 
  return (
    <div style={{
      width: "260px",
      minWidth: "260px",
      backgroundColor: dark ? "#1A1D27" : "#ffffff",
      borderRight: dark ? "1px solid #2a2d3a" : "1px solid #e8eaf0",
      height: "calc(100vh - 56px)",
      overflowY: "auto",
      position: "sticky",
      top: "56px",
      padding: "1rem 0",
      fontSize: "0.82rem",
    }}>
      {struktur.map((block) => (
        <div key={block.block} style={{ marginBottom: "1.5rem" }}>
 
          {/* Block Header */}
          <div style={{
            padding: "0.4rem 1rem",
            fontSize: "0.7rem",
            fontWeight: "700",
            color: block.farbe,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "0.25rem",
          }}>
            {block.block}
          </div>
 
          {block.bereiche.map((bereich) => (
            <div key={bereich.label}>
 
              {/* Bereichs-Dashboard Link */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <Link
                  to={bereich.path}
                  style={{
                    flex: 1,
                    display: "block",
                    padding: "0.45rem 1rem",
                    textDecoration: "none",
                    fontWeight: istBereichAktiv(bereich.path) ? "600" : "500",
                    color: istBereichAktiv(bereich.path)
                      ? "#4F6EF7"
                      : dark ? "#c9d1e0" : "#374151",
                    backgroundColor: istAktiv(bereich.path)
                      ? dark ? "#1e2235" : "#f0f4ff"
                      : "transparent",
                    borderLeft: istBereichAktiv(bereich.path)
                      ? "3px solid #4F6EF7"
                      : "3px solid transparent",
                    transition: "all 0.1s",
                  }}
                >
                  {bereich.label}
                </Link>
 
                {/* Toggle Button */}
                {bereich.unterseiten.length > 0 && (
                  <button
                    onClick={() => toggleBereich(bereich.label)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: dark ? "#8B92A5" : "#6B7280",
                      padding: "0 0.75rem",
                      fontSize: "0.7rem",
                    }}
                  >
                    {offen[bereich.label] || istBereichAktiv(bereich.path) ? "▲" : "▼"}
                  </button>
                )}
              </div>
 
              {/* Unterseiten */}
              {(offen[bereich.label] || istBereichAktiv(bereich.path)) && bereich.unterseiten.map((unter) => (
                <Link
                  key={unter.path}
                  to={unter.path}
                  style={{
                    display: "block",
                    padding: "0.35rem 1rem 0.35rem 2rem",
                    textDecoration: "none",
                    color: istAktiv(unter.path)
                      ? "#4F6EF7"
                      : dark ? "#8B92A5" : "#6B7280",
                    fontWeight: istAktiv(unter.path) ? "600" : "400",
                    backgroundColor: istAktiv(unter.path)
                      ? dark ? "#1e2235" : "#f0f4ff"
                      : "transparent",
                    borderLeft: istAktiv(unter.path)
                      ? "3px solid #4F6EF7"
                      : "3px solid transparent",
                    fontSize: "0.8rem",
                  }}
                >
                  {unter.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}