export const struktur = [
  {
    block: "🟢 AKTIVA – Mein Vermögen",
    farbe: "#22C55E",
    bereiche: [
      {
        label: "💱 Liquidität & Geldmarkt",
        path: "/assetklassen/lf",
        unterseiten: [
          { label: "🏦 Girokonten", path: "/assetklassen/lf/girokonto" },
          { label: "🐷 Tagesgeld", path: "/assetklassen/lf/tagesgeld" },
          { label: "🐷 Festgeld", path: "/assetklassen/lf/festgeld" },
          { label: "🌐 Fremdwährungen", path: "/assetklassen/lf/fremdwaehrung" },
        ]
      },
      {
        label: "📈 Wertpapiere & Derivate",
        path: "/assetklassen/wd",
        unterseiten: [
          { label: "📊 Aktien", path: "/assetklassen/wd/aktien" },
          { label: "📊 ETFs", path: "/assetklassen/wd/etf" },
          { label: "📊 Fonds", path: "/assetklassen/wd/fonds" },
          { label: "📊 ELTIFS", path: "/assetklassen/wd/eltif" },
          { label: "💶 Geldmarktfonds", path: "/assetklassen/wd/geldmarktfonds" },
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