import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
 
const struktur = [
  {
    block: "🟢 AKTIVA – Mein Vermögen",
    farbe: "#22C55E",
    bereiche: [
      {
        label: "💱 Liquidität & Geldmarkt",
        path: "/assetklassen/lf",
        unterseiten: [
          { label: "🏦 Girokonten", path: "/assetklassen/lf/girokonto" },
          { label: "🐷 Tagesgeld & Festgeld", path: "/assetklassen/lf/tagesgeld" },
          { label: "💶 Geldmarktfonds", path: "/assetklassen/lf/geldmarktfonds" },
          { label: "🌐 Fremdwährungen", path: "/assetklassen/lf/fremdwaehrung" },
        ]
      },
      {
        label: "📈 Wertpapiere & Derivate",
        path: "/assetklassen/wd",
        unterseiten: [
          { label: "📊 Aktien & ETFs", path: "/assetklassen/wd/aktien" },
          { label: "🚀 Hebelprodukte & Derivate", path: "/assetklassen/wd/derivate" },
          { label: "💼 Mitarbeiter- & Genossenschaftsanteile", path: "/assetklassen/wd/anteile" },
        ]
      },
      {
        label: "🏠 Immobilien & Sachwerte",
        path: "/assetklassen/immobilien",
        unterseiten: [
          { label: "🧱 Immobilien", path: "/assetklassen/immobilien/direkt" },
          { label: "🪙 Edelmetalle & Rohstoffe", path: "/assetklassen/immobilien/edelmetalle" },
          { label: "🚗 Fahrzeuge & Sammlerstücke", path: "/assetklassen/immobilien/sachwerte" },
        ]
      },
      {
        label: "🌐 Web3 & Krypto",
        path: "/assetklassen/krypto",
        unterseiten: [
          { label: "🪙 Coins & Staking", path: "/assetklassen/krypto/coins" },
          { label: "🖼️ NFTs & Liquidity Pools", path: "/assetklassen/krypto/nfts" },
        ]
      },
      {
        label: "💼 Business & Forderungen",
        path: "/assetklassen/business",
        unterseiten: [
          { label: "🏢 Firmenbeteiligungen & Unternehmen", path: "/assetklassen/business/firmen" },
          { label: "📜 IP, Patente & Digitale Besitztümer", path: "/assetklassen/business/ip" },
          { label: "🤝 Private Darlehen & Forderungen", path: "/assetklassen/business/darlehen" },
          { label: "🎁 Gutscheine & Bonuspunkte", path: "/assetklassen/business/gutscheine" },
        ]
      },
      {
        label: "🛡️ Vorsorge & Verträge",
        path: "/assetklassen/vorsorge",
        unterseiten: [
          { label: "📜 Lebens- & Rentenversicherungen", path: "/assetklassen/vorsorge/versicherungen" },
          { label: "🏛️ Staatliche Vorsorge", path: "/assetklassen/vorsorge/staatlich" },
          { label: "🏡 Bausparverträge & VWL", path: "/assetklassen/vorsorge/bauspar" },
        ]
      },
    ]
  },
  {
    block: "🔴 PASSIVA – Meine Verbindlichkeiten",
    farbe: "#EF4444",
    bereiche: [
      {
        label: "📉 Kredite & Schulden",
        path: "/assetklassen/kredite",
        unterseiten: [
          { label: "🏠 Immobiliendarlehen & KfW", path: "/assetklassen/kredite/hypotheken" },
          { label: "💳 Konsum-, Auto- & Kreditkartenschulden", path: "/assetklassen/kredite/konsum" },
          { label: "👥 Privatschulden", path: "/assetklassen/kredite/privat" },
        ]
      },
    ]
  },
  {
    block: "⚙️ SYSTEM & TOOLS",
    farbe: "#8B5CF6",
    bereiche: [
      {
        label: "⚖️ Steuern & Töpfe",
        path: "/assetklassen/steuern",
        unterseiten: []
      },
      {
        label: "🃏 Joker (Eigene Assets)",
        path: "/assetklassen/joker",
        unterseiten: []
      },
    ]
  }
]
 
export default function AssetSidebar({ darkMode: dark }) {
  const location = useLocation()
  const [offen, setOffen] = useState({})
 
  const istAktiv = (path) => location.pathname === path
  const istBereichAktiv = (path) => location.pathname.startsWith(path)
 
  const toggleBereich = (label) => {
    setOffen(prev => ({ ...prev, [label]: !prev[label] }))
  }
 
  if (!location.pathname.startsWith("/assetklassen")) return null
 
  return (
    <div style={{
      width: "100%",
      maxWidth: "260px",
      backgroundColor: dark ? "#1A1D27" : "#ffffff",
      borderRight: dark ? "1px solid #2a2d3a" : "1px solid #e8eaf0",
      height: "auto",
      maxHeight: "calc(100vh - 56px)",
      overflowY: "auto",
      padding: "1rem 0",
      fontSize: "0.82rem",
    }}>
      {struktur.map((block) => (
        <div key={block.block} style={{ marginBottom: "1.5rem" }}>
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