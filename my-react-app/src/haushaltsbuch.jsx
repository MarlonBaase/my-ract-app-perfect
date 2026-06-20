import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"

const FARBEN = ["#4F6EF7", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

const card = (dark) => ({
  backgroundColor: dark ? "#1A1D27" : "#ffffff",
  borderRadius: "12px",
  border: dark ? "1px solid #2a2d3a" : "1px solid rgba(0,0,0,0.06)",
  boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
  padding: "1.5rem",
})

const input = (dark) => ({
  backgroundColor: dark ? "#0F1117" : "#F8F9FC",
  border: dark ? "1px solid #2a2d3a" : "1px solid #e0e0e0",
  borderRadius: "8px",
  padding: "0.5rem 0.75rem",
  color: dark ? "#F1F3F9" : "#0F1117",
  fontSize: "0.875rem",
  outline: "none",
  width: "100%",
})

const selectStyle = (dark) => ({
  ...input(dark),
  cursor: "pointer",
})

const btnPrimary = {
  backgroundColor: "#4F6EF7",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  padding: "0.5rem 1.25rem",
  fontSize: "0.875rem",
  fontWeight: "600",
  cursor: "pointer",
  whiteSpace: "nowrap",
}

const btnGhost = (dark, aktiv) => ({
  backgroundColor: aktiv ? "#4F6EF7" : "transparent",
  color: aktiv ? "#ffffff" : dark ? "#8B92A5" : "#6B7280",
  border: aktiv ? "none" : dark ? "1px solid #2a2d3a" : "1px solid #e0e0e0",
  borderRadius: "8px",
  padding: "0.4rem 1rem",
  fontSize: "0.8rem",
  fontWeight: aktiv ? "600" : "400",
  cursor: "pointer",
})

const labelStyle = (dark) => ({
  fontSize: "0.75rem",
  fontWeight: "600",
  color: dark ? "#8B92A5" : "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "0.75rem",
  display: "block",
})

export default function Haushaltsbuch({ darkMode: dark }) {
  const [startkapital, setStartkapital] = useState(0);
  const [kapital, setKapital] = useState(0);
  const [neuesStartkapital, setNeuesStartkapital] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [betrag, setBetrag] = useState("");
  const [eintraege, setEintraege] = useState([]);
  const [einnahmenBeschreibung, setEinnahmenBeschreibung] = useState("");
  const [einnahmenBetrag, setEinnahmenBetrag] = useState("");
  const [kategorien, setKategorien] = useState([])
  const [ausgabeKategorie, setAusgabeKategorie] = useState("")
  const [einnahmeKategorie, setEinnahmeKategorie] = useState("")
  const [neueKategorie, setNeueKategorie] = useState("")
  const [modalOffen, setModalOffen] = useState(false)
  const [zuBearbeiten, setZuBearbeiten] = useState(null)
  const [editBeschreibung, setEditBeschreibung] = useState("")
  const [editBetrag, setEditBetrag] = useState("")
  const [editKategorie, setEditKategorie] = useState("")
  const [wiederkehrende, setWiederkehrende] = useState([]);
  const [beschreibungInter, setBeschreibungInter] = useState("");
  const [betragInter, setBetragInter] = useState("");
  const [kategorieInter, setkategorieInter] = useState("");
  const [typInter, setTypInter] = useState("");
  const [intervall, setIntervall] = useState("");
  const [zeitraum, setZeitraum] = useState("monat")
  const [summeEinnahmen, setSummeEinnahmen] = useState(0)
  const [summeAusgaben, setSummeAusgaben] = useState(0)
  const [diagrammDaten, setDiagrammDaten] = useState([])
  const [kreisDatenAusgaben, setKreisDatenAusgaben] = useState([])
  const [kreisDatenEinnahmen, setKreisDatenEinnahmen] = useState([])
  const [tabellenZeitraum, setTabellenZeitraum] = useState("monat")
  const [tabellenMonat, setTabellenMonat] = useState(new Date().getMonth())
  const [tabellenJahr, setTabellenJahr] = useState(new Date().getFullYear())

  useEffect(() => {
    const init = async () => {
      try {
        await ladeAlles()
        await ladeKategorien()
        const daten = await ladeWiederkehrende()
        await pruefeWiederkehrende(daten)
        await ladeAlles()
      } catch (err) {
        console.error("Fehler in init:", err)
      }
    }
    init()
  }, [])

  useEffect(() => {
    berechneZeitraum()
    berechneDiagrammDaten()
    berechneKreisDaten()
  }, [zeitraum, eintraege])

  const ladeAlles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: kapitalData } = await supabase.from("kapital").select("betrag").eq("user_id", user.id).single();
    const start = kapitalData?.betrag ?? 0;
    setStartkapital(start);
    const { data: ausgaben } = await supabase.from("haushaltsbuch").select("*").eq("user_id", user.id).order("erstellt_am", { ascending: false });
    const { data: einnahmen } = await supabase.from("einnahmen").select("*").eq("user_id", user.id).order("erstellt_am", { ascending: false });
    const gesamtAusgaben = ausgaben?.reduce((sum, e) => sum + e.betrag, 0) ?? 0;
    const gesamtEinnahmen = einnahmen?.reduce((sum, e) => sum + e.betrag, 0) ?? 0;
    setKapital(start - gesamtAusgaben + gesamtEinnahmen);
    const alle = [
      ...(ausgaben ?? []).map((e) => ({ ...e, typ: "ausgabe" })),
      ...(einnahmen ?? []).map((e) => ({ ...e, typ: "einnahme" })),
    ].sort((a, b) => new Date(b.erstellt_am) - new Date(a.erstellt_am));
    setEintraege(alle);
  };

  const startkapitalSpeichern = async () => {
    if (!neuesStartkapital) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("kapital").upsert({ user_id: user.id, betrag: parseFloat(neuesStartkapital) }, { onConflict: "user_id" });
    setNeuesStartkapital(""); ladeAlles();
  };

  const ausgabeHinzufuegen = async () => {
    if (!beschreibung || !betrag || !ausgabeKategorie) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("haushaltsbuch").insert({ user_id: user.id, beschreibung, betrag: parseFloat(betrag), kategorie: ausgabeKategorie })
    setBeschreibung(""); setBetrag(""); setAusgabeKategorie(""); ladeAlles()
  }

  const einnahmeHinzufuegen = async () => {
    if (!einnahmenBeschreibung || !einnahmenBetrag || !einnahmeKategorie) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("einnahmen").insert({ user_id: user.id, beschreibung: einnahmenBeschreibung, betrag: parseFloat(einnahmenBetrag), kategorie: einnahmeKategorie })
    setEinnahmenBeschreibung(""); setEinnahmenBetrag(""); setEinnahmeKategorie(""); ladeAlles()
  }

  const ladeKategorien = async () => {
    const { data } = await supabase.from("kategorien").select("*").order("name", { ascending: true })
    if (data) setKategorien(data)
  }

  const kategorieHinzufuegen = async () => {
    if (!neueKategorie) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("kategorien").insert({ user_id: user.id, name: neueKategorie, ist_vordefiniert: false })
    setNeueKategorie(""); ladeKategorien()
  }

  const kategorieLoeschen = async (id, ist_vordefiniert) => {
    if (ist_vordefiniert === false) await supabase.from("kategorien").delete().eq("id", id)
    ladeKategorien()
  }

  const eintragLoeschen = async (id, typ) => {
    if (typ === "ausgabe") await supabase.from("haushaltsbuch").delete().eq("id", id)
    if (typ === "einnahme") await supabase.from("einnahmen").delete().eq("id", id)
    ladeAlles()
  }

  const bearbeitenOeffnen = (eintrag) => {
    setZuBearbeiten(eintrag); setEditBeschreibung(eintrag.beschreibung)
    setEditBetrag(eintrag.betrag); setEditKategorie(eintrag.kategorie); setModalOffen(true)
  }

  const bearbeitenSchliessen = () => {
    setModalOffen(false); setZuBearbeiten(null)
    setEditBeschreibung(""); setEditBetrag(""); setEditKategorie("")
  }

  const eintragSpeichern = async (id, typ) => {
    const update = { beschreibung: editBeschreibung, betrag: parseFloat(editBetrag), kategorie: editKategorie }
    if (typ === "ausgabe") await supabase.from("haushaltsbuch").update(update).eq("id", id)
    if (typ === "einnahme") await supabase.from("einnahmen").update(update).eq("id", id)
    bearbeitenSchliessen(); ladeAlles()
  }

  const ladeWiederkehrende = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from("wiederkehrend").select("*").eq("user_id", user.id).order("erstellt_am", { ascending: false })
    if (data) setWiederkehrende(data)
    return data ?? []
  }

  const wiederkehrendHinzufuegen = async () => {
    if (!beschreibungInter || !betragInter || !kategorieInter || !typInter || !intervall) return
    const now = new Date()
    const lokalDatum = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("wiederkehrend").insert({ user_id: user.id, beschreibung: beschreibungInter, betrag: parseFloat(betragInter), kategorie: kategorieInter, typ: typInter, intervall, naechste_faelligkeit: lokalDatum })
    setBeschreibungInter(""); setBetragInter(""); setkategorieInter(""); setTypInter(""); setIntervall("")
    ladeWiederkehrende()
  }

  const pruefeWiederkehrende = async (liste) => {
    const { data: { user } } = await supabase.auth.getUser()
    const now = new Date()
    const heute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    for (const eintrag of liste) {
      if (eintrag.naechste_faelligkeit <= heute) {
        if (eintrag.typ === "ausgabe") await supabase.from("haushaltsbuch").insert({ user_id: user.id, beschreibung: eintrag.beschreibung, betrag: parseFloat(eintrag.betrag), kategorie: eintrag.kategorie })
        if (eintrag.typ === "einnahme") await supabase.from("einnahmen").insert({ user_id: user.id, beschreibung: eintrag.beschreibung, betrag: parseFloat(eintrag.betrag), kategorie: eintrag.kategorie })
        const parts = eintrag.naechste_faelligkeit.split("-")
        const naechsteDatum = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        if (eintrag.intervall === "täglich") naechsteDatum.setDate(naechsteDatum.getDate() + 1)
        if (eintrag.intervall === "wöchentlich") naechsteDatum.setDate(naechsteDatum.getDate() + 7)
        if (eintrag.intervall === "monatlich") naechsteDatum.setMonth(naechsteDatum.getMonth() + 1)
        if (eintrag.intervall === "jährlich") naechsteDatum.setFullYear(naechsteDatum.getFullYear() + 1)
        const neuesFaelligkeitsDatum = `${naechsteDatum.getFullYear()}-${String(naechsteDatum.getMonth() + 1).padStart(2, '0')}-${String(naechsteDatum.getDate()).padStart(2, '0')}`
        await supabase.from("wiederkehrend").update({ naechste_faelligkeit: neuesFaelligkeitsDatum }).eq("id", eintrag.id)
      }
    }
  }

  const zeitraumFilterFn = (datum) => {
    const jetzt = new Date()
    if (zeitraum === "heute") return datum.getFullYear() === jetzt.getFullYear() && datum.getMonth() === jetzt.getMonth() && datum.getDate() === jetzt.getDate()
    if (zeitraum === "woche") return (jetzt - datum) / (1000 * 60 * 60 * 24) <= 7
    if (zeitraum === "monat") return datum.getMonth() === jetzt.getMonth() && datum.getFullYear() === jetzt.getFullYear()
    if (zeitraum === "jahr") return datum.getFullYear() === jetzt.getFullYear()
  }

  const berechneZeitraum = () => {
    const ausgaben = eintraege.filter(e => e.typ === "ausgabe" && zeitraumFilterFn(new Date(e.erstellt_am)))
    const einnahmen = eintraege.filter(e => e.typ === "einnahme" && zeitraumFilterFn(new Date(e.erstellt_am)))
    setSummeAusgaben(ausgaben.reduce((sum, e) => sum + e.betrag, 0))
    setSummeEinnahmen(einnahmen.reduce((sum, e) => sum + e.betrag, 0))
  }

  const berechneDiagrammDaten = () => {
    const jetzt = new Date()
    let punkte = []
    if (zeitraum === "heute") {
      for (let i = 0; i < 24; i++) {
        const einnahmen = eintraege.filter(e => e.typ === "einnahme" && new Date(e.erstellt_am.replace(" ", "T")).getHours() === i && new Date(e.erstellt_am.replace(" ", "T")).getDate() === jetzt.getDate()).reduce((sum, e) => sum + e.betrag, 0)
        const ausgaben = eintraege.filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am.replace(" ", "T")).getHours() === i && new Date(e.erstellt_am.replace(" ", "T")).getDate() === jetzt.getDate()).reduce((sum, e) => sum + e.betrag, 0)
        punkte.push({ label: `${i}:00`, einnahmen, ausgaben })
      }
    }
    if (zeitraum === "woche") {
      for (let i = 6; i >= 0; i--) {
        const tag = new Date(); tag.setDate(jetzt.getDate() - i)
        const einnahmen = eintraege.filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getDate() === tag.getDate() && new Date(e.erstellt_am).getMonth() === tag.getMonth()).reduce((sum, e) => sum + e.betrag, 0)
        const ausgaben = eintraege.filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getDate() === tag.getDate() && new Date(e.erstellt_am).getMonth() === tag.getMonth()).reduce((sum, e) => sum + e.betrag, 0)
        punkte.push({ label: `${tag.getDate()}.`, einnahmen, ausgaben })
      }
    }
    if (zeitraum === "monat") {
      const tageImMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate()
      for (let i = 1; i <= tageImMonat; i++) {
        const einnahmen = eintraege.filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getDate() === i && new Date(e.erstellt_am).getMonth() === jetzt.getMonth()).reduce((sum, e) => sum + e.betrag, 0)
        const ausgaben = eintraege.filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getDate() === i && new Date(e.erstellt_am).getMonth() === jetzt.getMonth()).reduce((sum, e) => sum + e.betrag, 0)
        punkte.push({ label: `${i}.`, einnahmen, ausgaben })
      }
    }
    if (zeitraum === "jahr") {
      const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
      for (let i = 0; i < 12; i++) {
        const einnahmen = eintraege.filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getMonth() === i && new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear()).reduce((sum, e) => sum + e.betrag, 0)
        const ausgaben = eintraege.filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getMonth() === i && new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear()).reduce((sum, e) => sum + e.betrag, 0)
        punkte.push({ label: monate[i], einnahmen, ausgaben })
      }
    }
    setDiagrammDaten(punkte)
  }

  const berechneKreisDaten = () => {
    const gefilterteAusgaben = eintraege.filter(e => e.typ === "ausgabe" && zeitraumFilterFn(new Date(e.erstellt_am)))
    const ausgabenProKategorie = gefilterteAusgaben.reduce((acc, e) => { acc[e.kategorie] = (acc[e.kategorie] ?? 0) + e.betrag; return acc }, {})
    setKreisDatenAusgaben(Object.entries(ausgabenProKategorie).map(([name, value]) => ({ name, value })))
    const gefilterteEinnahmen = eintraege.filter(e => e.typ === "einnahme" && zeitraumFilterFn(new Date(e.erstellt_am)))
    const einnahmenProKategorie = gefilterteEinnahmen.reduce((acc, e) => { acc[e.kategorie] = (acc[e.kategorie] ?? 0) + e.betrag; return acc }, {})
    setKreisDatenEinnahmen(Object.entries(einnahmenProKategorie).map(([name, value]) => ({ name, value })))
  }

  const tabellenFilter = (e) => {
    const datum = new Date(e.erstellt_am)
    const jetzt = new Date()
    if (tabellenZeitraum === "heute") return datum.getFullYear() === jetzt.getFullYear() && datum.getMonth() === jetzt.getMonth() && datum.getDate() === jetzt.getDate()
    if (tabellenZeitraum === "woche") return (jetzt - datum) / (1000 * 60 * 60 * 24) <= 7
    if (tabellenZeitraum === "monat") return datum.getMonth() === jetzt.getMonth() && datum.getFullYear() === jetzt.getFullYear()
    if (tabellenZeitraum === "jahr") return datum.getFullYear() === jetzt.getFullYear()
    if (tabellenZeitraum === "spezifisch") return datum.getFullYear() === tabellenJahr && datum.getMonth() === tabellenMonat
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* HEADER */}
      <div style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#4F6EF7", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>Haushaltsbuch</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.75rem", fontWeight: "700", color: dark ? "#F1F3F9" : "#0F1117", lineHeight: 1.2 }}>
          {kapital >= 0 ? "+" : ""}{kapital.toFixed(2)} €
        </h1>
        <p style={{ fontSize: "0.875rem", color: dark ? "#8B92A5" : "#6B7280", marginTop: "0.25rem" }}>
          Startkapital: {startkapital.toFixed(2)} €
        </p>
      </div>

      {/* ZEITRAUM + SUMMEN */}
      <div style={{ ...card(dark), marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["heute", "woche", "monat", "jahr"].map(z => (
              <button key={z} style={btnGhost(dark, zeitraum === z)} onClick={() => setZeitraum(z)}>
                {z.charAt(0).toUpperCase() + z.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "2.5rem" }}>
            <div>
              <span style={{ fontSize: "0.7rem", fontWeight: "600", color: dark ? "#8B92A5" : "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Einnahmen</span>
              <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#22C55E", fontFamily: "'Playfair Display', serif", marginTop: "0.1rem" }}>+{summeEinnahmen.toFixed(2)} €</p>
            </div>
            <div>
              <span style={{ fontSize: "0.7rem", fontWeight: "600", color: dark ? "#8B92A5" : "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ausgaben</span>
              <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#EF4444", fontFamily: "'Playfair Display', serif", marginTop: "0.1rem" }}>-{summeAusgaben.toFixed(2)} €</p>
            </div>
          </div>
        </div>
      </div>

      {/* LINIENDIAGRAMM */}
      <div style={{ ...card(dark), marginBottom: "1.5rem", overflowX: "auto" }}>
        <p style={labelStyle(dark)}>Cashflow</p>
        <LineChart width={700} height={250} data={diagrammDaten}>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#2a2d3a" : "#f0f0f0"} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: dark ? "#8B92A5" : "#6B7280" }} />
          <YAxis tick={{ fontSize: 11, fill: dark ? "#8B92A5" : "#6B7280" }} />
          <Tooltip contentStyle={{ backgroundColor: dark ? "#1A1D27" : "#fff", border: "none", borderRadius: "8px", fontSize: "0.8rem" }} />
          <Legend />
          <Line type="monotone" dataKey="einnahmen" stroke="#22C55E" strokeWidth={2} dot={false} name="Einnahmen" />
          <Line type="monotone" dataKey="ausgaben" stroke="#EF4444" strokeWidth={2} dot={false} name="Ausgaben" />
        </LineChart>
      </div>

      {/* KUCHENDIAGRAMME */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={card(dark)}>
          <p style={labelStyle(dark)}>Ausgaben pro Kategorie</p>
          <PieChart width={280} height={250}>
            <Pie data={kreisDatenAusgaben} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
              {kreisDatenAusgaben.map((_, index) => <Cell key={index} fill={FARBEN[index % FARBEN.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: dark ? "#1A1D27" : "#fff", border: "none", borderRadius: "8px" }} />
            <Legend />
          </PieChart>
        </div>
        <div style={card(dark)}>
          <p style={labelStyle(dark)}>Einnahmen pro Kategorie</p>
          <PieChart width={280} height={250}>
            <Pie data={kreisDatenEinnahmen} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
              {kreisDatenEinnahmen.map((_, index) => <Cell key={index} fill={FARBEN[index % FARBEN.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: dark ? "#1A1D27" : "#fff", border: "none", borderRadius: "8px" }} />
            <Legend />
          </PieChart>
        </div>
      </div>

      {/* FORMULARE */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={card(dark)}>
          <p style={labelStyle(dark)}>Ausgabe hinzufügen</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input style={input(dark)} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Beschreibung" />
            <input style={input(dark)} value={betrag} onChange={e => setBetrag(e.target.value)} placeholder="Betrag" type="number" />
            <select style={selectStyle(dark)} value={ausgabeKategorie} onChange={e => setAusgabeKategorie(e.target.value)}>
              <option value="">Kategorie wählen</option>
              {kategorien.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
            </select>
            <button style={{ ...btnPrimary, backgroundColor: "#EF4444" }} onClick={ausgabeHinzufuegen}>Ausgabe hinzufügen</button>
          </div>
        </div>
        <div style={card(dark)}>
          <p style={labelStyle(dark)}>Einnahme hinzufügen</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input style={input(dark)} value={einnahmenBeschreibung} onChange={e => setEinnahmenBeschreibung(e.target.value)} placeholder="Beschreibung" />
            <input style={input(dark)} value={einnahmenBetrag} onChange={e => setEinnahmenBetrag(e.target.value)} placeholder="Betrag" type="number" />
            <select style={selectStyle(dark)} value={einnahmeKategorie} onChange={e => setEinnahmeKategorie(e.target.value)}>
              <option value="">Kategorie wählen</option>
              {kategorien.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
            </select>
            <button style={{ ...btnPrimary, backgroundColor: "#22C55E" }} onClick={einnahmeHinzufuegen}>Einnahme hinzufügen</button>
          </div>
        </div>
      </div>

      {/* WIEDERKEHREND + STARTKAPITAL */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={card(dark)}>
          <p style={labelStyle(dark)}>Wiederkehrenden Eintrag hinzufügen</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <input style={input(dark)} value={beschreibungInter} onChange={e => setBeschreibungInter(e.target.value)} placeholder="Beschreibung" />
            <input style={input(dark)} value={betragInter} onChange={e => setBetragInter(e.target.value)} placeholder="Betrag" type="number" />
            <select style={selectStyle(dark)} value={typInter} onChange={e => setTypInter(e.target.value)}>
              <option value="">Typ wählen</option>
              <option value="ausgabe">Ausgabe</option>
              <option value="einnahme">Einnahme</option>
            </select>
            <select style={selectStyle(dark)} value={kategorieInter} onChange={e => setkategorieInter(e.target.value)}>
              <option value="">Kategorie wählen</option>
              {kategorien.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
            </select>
            <select style={selectStyle(dark)} value={intervall} onChange={e => setIntervall(e.target.value)}>
              <option value="">Intervall wählen</option>
              <option value="täglich">Täglich</option>
              <option value="wöchentlich">Wöchentlich</option>
              <option value="monatlich">Monatlich</option>
              <option value="jährlich">Jährlich</option>
            </select>
            <button style={btnPrimary} onClick={wiederkehrendHinzufuegen}>Hinzufügen</button>
          </div>
        </div>
        <div style={card(dark)}>
          <p style={labelStyle(dark)}>Startkapital setzen</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input style={input(dark)} placeholder={`Aktuell: ${startkapital.toFixed(2)} €`} type="number" value={neuesStartkapital} onChange={e => setNeuesStartkapital(e.target.value)} />
            <button style={btnPrimary} onClick={startkapitalSpeichern}>Speichern</button>
          </div>
        </div>
      </div>

      {/* KATEGORIEN */}
      <div style={{ ...card(dark), marginBottom: "1.5rem" }}>
        <p style={labelStyle(dark)}>Kategorien verwalten</p>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
          <input style={input(dark)} value={neueKategorie} onChange={e => setNeueKategorie(e.target.value)} placeholder="z.B. 🎮 Gaming" />
          <button style={btnPrimary} onClick={kategorieHinzufuegen}>Hinzufügen</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {kategorien.map(k => (
            <div key={k.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: dark ? "#0F1117" : "#F8F9FC", border: dark ? "1px solid #2a2d3a" : "1px solid #e0e0e0", borderRadius: "20px", padding: "0.3rem 0.75rem", fontSize: "0.8rem", color: dark ? "#c9d1e0" : "#374151" }}>
              {k.name}
              {!k.ist_vordefiniert && (
                <button onClick={() => kategorieLoeschen(k.id, k.ist_vordefiniert)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: "0.75rem", padding: 0 }}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TRANSAKTIONEN */}
      <div style={card(dark)}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <p style={labelStyle(dark)}>Transaktionen</p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            {["heute", "woche", "monat", "jahr"].map(z => (
              <button key={z} style={btnGhost(dark, tabellenZeitraum === z)} onClick={() => setTabellenZeitraum(z)}>
                {z.charAt(0).toUpperCase() + z.slice(1)}
              </button>
            ))}
            <select style={{ ...selectStyle(dark), width: "auto" }} onChange={e => { setTabellenMonat(parseInt(e.target.value)); setTabellenZeitraum("spezifisch") }}>
              {["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"].map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select style={{ ...selectStyle(dark), width: "auto" }} onChange={e => { setTabellenJahr(parseInt(e.target.value)); setTabellenZeitraum("spezifisch") }}>
              {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => new Date().getFullYear() - i).map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {eintraege.filter(tabellenFilter).map(e => (
            <div key={e.id + e.typ} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", backgroundColor: dark ? "#0F1117" : "#F8F9FC", borderRadius: "8px", border: dark ? "1px solid #2a2d3a" : "1px solid #f0f0f0" }}>
              <div>
                <p style={{ fontWeight: "500", fontSize: "0.875rem", color: dark ? "#F1F3F9" : "#0F1117" }}>{e.beschreibung}</p>
                <p style={{ fontSize: "0.75rem", color: dark ? "#8B92A5" : "#6B7280", marginTop: "0.1rem" }}>{e.kategorie} · {new Date(e.erstellt_am).toLocaleDateString("de-DE")}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1rem", color: e.typ === "ausgabe" ? "#EF4444" : "#22C55E" }}>
                  {e.typ === "ausgabe" ? "-" : "+"}{e.betrag.toFixed(2)} €
                </span>
                <button onClick={() => bearbeitenOeffnen(e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>✏️</button>
                <button onClick={() => eintragLoeschen(e.id, e.typ)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {modalOffen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ ...card(dark), minWidth: "360px", maxWidth: "480px", width: "100%" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "700", color: dark ? "#F1F3F9" : "#0F1117", marginBottom: "1.25rem" }}>Eintrag bearbeiten</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input style={input(dark)} value={editBeschreibung} onChange={e => setEditBeschreibung(e.target.value)} placeholder="Beschreibung" />
              <input style={input(dark)} value={editBetrag} onChange={e => setEditBetrag(e.target.value)} placeholder="Betrag" type="number" />
              <select style={selectStyle(dark)} value={editKategorie} onChange={e => setEditKategorie(e.target.value)}>
                <option value="">Kategorie wählen</option>
                {kategorien.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button style={btnPrimary} onClick={() => eintragSpeichern(zuBearbeiten.id, zuBearbeiten.typ)}>Speichern</button>
                <button style={btnGhost(dark, false)} onClick={bearbeitenSchliessen}>Abbrechen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}