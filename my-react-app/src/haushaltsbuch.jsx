import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"

export default function haushaltsbuch() {
  const [startkapital, setStartkapital] = useState(0);
  const [kapital, setKapital] = useState(0);
  const [neuesStartkapital, setNeuesStartkapital] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [betrag, setBetrag] = useState("");
  const [eintraege, setEintraege] = useState([]);
  const [einnahmenBeschreibung, setEinnahmenBeschreibung] = useState("");
  const [einnahmenBetrag, setEinnahmenBetrag] = useState("");
  const [ausgabeBeschreibung, setAusgabeBeschreibung] = useState("");
  const [ausgabeBetrag, setAusgabeBetrag] = useState("");
  const [kategorien, setKategorien] = useState([])
  const [ausgabeKategorie, setAusgabeKategorie] = useState("")
  const [einnahmeKategorie, setEinnahmeKategorie] = useState("")
  const [neueKategorie, setNeueKategorie] = useState("")
  const [modalOffen, setModalOffen] = useState(false)  // sichtbar: true oder false, nicht ""
  const [zuBearbeiten, setZuBearbeiten] = useState(null) // kein Eintrag am Anfang = null
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
  const [tabellenZeitraum, setTabellenZeitraum] = useState("monat") // heute/woche/monat/jahr
  const [tabellenMonat, setTabellenMonat] = useState(new Date().getMonth()) // 0-11
  const [tabellenJahr, setTabellenJahr] = useState(new Date().getFullYear()) // z.B. 2026

  useEffect(() => {
    const init = async () => {
      try {
        await ladeAlles()
        await ladeKategorien()
        const daten = await ladeWiederkehrende()
        console.log("Daten:", daten)
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: kapitalData } = await supabase
      .from("konfiguration_kapital")
      .select("betrag")
      .eq("benutzer_id", user.id)
      .single();

    const start = kapitalData?.betrag ?? 0;
    setStartkapital(start);

    const { data: ausgaben } = await supabase
      .from("transaktionsprotokoll")
      .select("*")
      .eq("benutzer_id", user.id) 
      .eq("typ", "ausgabe") 
      .order("erstellt_am", { ascending: false });

    const { data: einnahmen } = await supabase
      .from("transaktionsprotokoll")
      .select("*")
      .eq("benutzer_id", user.id)  // ← fehlt noch
      .eq("typ", "einnahme")
      .order("erstellt_am", { ascending: false });

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("konfiguration_kapital").upsert(
      {
        benutzer_id: user.id,
        betrag: parseFloat(neuesStartkapital),
      },
      { onConflict: "benutzer_id" }
    );
    setNeuesStartkapital("");
    ladeAlles();
  };

  const ausgabeHinzufuegen = async () => {
    if (!ausgabeBeschreibung || !ausgabeBetrag || !ausgabeKategorie) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("transaktionsprotokoll").insert({
      benutzer_id: user.id,
      notizen: ausgabeBeschreibung,
      betrag: parseFloat(ausgabeBetrag),
      kategorie: ausgabeKategorie,
      typ: "ausgabe"
    })
    setAusgabeBeschreibung("")
    setAusgabeBetrag("")
    setAusgabeKategorie("")
    ladeAlles()
  }

  const einnahmeHinzufuegen = async () => {
    if (!einnahmenBeschreibung || !einnahmenBetrag || !einnahmeKategorie) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("transaktionsprotokoll").insert({
      benutzer_id: user.id,
      notizen: einnahmenBeschreibung,
      betrag: parseFloat(einnahmenBetrag),
      kategorie: einnahmeKategorie,
      typ: "einnahme"
    })
    setEinnahmenBeschreibung("")
    setEinnahmenBetrag("")
    setEinnahmeKategorie("")
    ladeAlles()
  }

  const ladeKategorien = async () => {
    const { data } = await supabase
      .from("transaktionskategorie")
      .select("*")
      .order("name", { ascending: true })

    if (data) setKategorien(data)
  }

  const kategorieHinzufuegen = async () => {
    if (!neueKategorie) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("transaktionskategorie").insert({
      benutzer_id: user.id,
      name: neueKategorie,
      ist_vordefiniert: false,
      erstellt_am: new Date()
    })
    setNeueKategorie("")
    ladeKategorien()
  }


  const eintragLoeschen = async (id, typ) => {
    if (typ === "ausgabe") {
      await supabase.from("transaktionsprotokoll").delete().eq("id", id)
    }
    if (typ === "einnahme") {
      await supabase.from("transaktionsprotokoll").delete().eq("id", id)
    }
    ladeAlles()
  }

  const bearbeitenOeffnen = (eintrag) => {
    setZuBearbeiten(eintrag)
    setEditBeschreibung(eintrag.beschreibung)
    setEditBetrag(eintrag.betrag)
    setEditKategorie(eintrag.kategorie)
    setModalOffen(true)
  }

  const bearbeitenSchliessen = () => {
    setModalOffen(false)
    setZuBearbeiten(null)
    setEditBeschreibung("")
    setEditBetrag("")
    setEditKategorie("")
  }

  const eintragSpeichern = async (id, typ) => {
    if (typ === "ausgabe") {
      await supabase.from("transaktionsprotokoll").update({
        notizen: editBeschreibung,
        betrag: parseFloat(editBetrag),
        kategorie: editKategorie,
        typ: "ausgabe"
      }).eq("id", id)
    }
    if (typ === "einnahme") {
      await supabase.from("transaktionsprotokoll").update({
        notizen: editBeschreibung,
        betrag: parseFloat(editBetrag),
        kategorie: editKategorie,
        typ: "einnahme"
      }).eq("id", id)
    }
    bearbeitenSchliessen()
    ladeAlles()
  }

  const ladeWiederkehrende = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from("transaktionsprotokoll")
      .select("*")
      .eq("benutzer_id", user.id)
      .eq("wiederkehrend", true)
      .order("erstellt_am", { ascending: false })

    if (data) setWiederkehrende(data)
    return data ?? []  // ← zurückgeben!
  }

  const wiederkehrendHinzufuegen = async () => {
    if (!beschreibungInter || !betragInter || !kategorieInter || !typInter || !intervall)
      return
    const now = new Date()
    const lokalDatum = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`


    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("transaktionsprotokoll").insert({
      benutzer_id: user.id,
      notizen: beschreibungInter,  // Spaltenname: Wert
      betrag: parseFloat(betragInter),  // betragInter nicht betrag!
      kategorie: kategorieInter,
      typ: typInter,
      wiederkehrend: true,
      intervall: intervall,
      naechste_faelligkeit: lokalDatum
    })

    setBeschreibungInter("")
    setBetragInter("")
    setkategorieInter("")
    setTypInter("")
    setIntervall("")
    ladeWiederkehrende()
  }

  const pruefeWiederkehrende = async (liste) => {
    const { data: { user } } = await supabase.auth.getUser()

    const now = new Date()
    const heute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    for (const eintrag of liste) {
      if (eintrag.naechste_faelligkeit <= heute) {
        if (eintrag.typ === "ausgabe") {
          await supabase.from("transaktionsprotokoll").insert({
            benutzer_id: user.id,
            notizen: eintrag.notizen,
            betrag: parseFloat(eintrag.betrag),
            kategorie: eintrag.kategorie,
            typ: "ausgabe"
          })
        }
        if (eintrag.typ === "einnahme") {
          await supabase.from("transaktionsprotokoll").insert({
            benutzer_id: user.id,
            notizen: eintrag.notizen,
            betrag: parseFloat(eintrag.betrag),
            kategorie: eintrag.kategorie,
            typ: "einnahme"
          })
        }

        const parts = eintrag.naechste_faelligkeit.split("-")
        const naechsteDatum = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))

        if (eintrag.intervall === "täglich") naechsteDatum.setDate(naechsteDatum.getDate() + 1)
        if (eintrag.intervall === "wöchentlich") naechsteDatum.setDate(naechsteDatum.getDate() + 7)
        if (eintrag.intervall === "monatlich") naechsteDatum.setMonth(naechsteDatum.getMonth() + 1)
        if (eintrag.intervall === "jährlich") naechsteDatum.setFullYear(naechsteDatum.getFullYear() + 1)

        const neuesFaelligkeitsDatum = `${naechsteDatum.getFullYear()}-${String(naechsteDatum.getMonth() + 1).padStart(2, '0')}-${String(naechsteDatum.getDate()).padStart(2, '0')}`

        await supabase.from("transaktionsprotokoll")
          .update({ naechste_faelligkeit: neuesFaelligkeitsDatum })
          .eq("id", eintrag.id)
          .eq("wiederkehrend", true)
      }
    }
  }

  const kategorieLoeschen = async (id, ist_vordefiniert) => {
    if (ist_vordefiniert === false) {
      await supabase.from("transaktionskategorie").delete().eq("id", id)
    }
    ladeKategorien()
  }

  const berechneZeitraum = () => {
    const jetzt = new Date()

    const gefilterteAusgaben = eintraege.filter(e => {
      if (e.typ !== "ausgabe") return false
      const datum = new Date(e.erstellt_am)

      if (zeitraum === "heute") {
        return (
          datum.getFullYear() === jetzt.getFullYear() &&
          datum.getMonth() === jetzt.getMonth() &&
          datum.getDate() === jetzt.getDate()
        )
      }
      if (zeitraum === "woche") {
        const diffInMs = jetzt - datum  // Differenz in Millisekunden
        const diffInTagen = diffInMs / (1000 * 60 * 60 * 24)  // umrechnen in Tage
        return diffInTagen <= 7
      }
      if (zeitraum === "monat") {
        return (
          datum.getMonth() === jetzt.getMonth() &&
          datum.getFullYear() === jetzt.getFullYear()
        )
      }
      if (zeitraum === "jahr") {
        return (
          datum.getFullYear() === jetzt.getFullYear()
        )
      }
    })

    const gefilterteEinnahmen = eintraege.filter(e => {
      if (e.typ !== "einnahme") return false
      const datum = new Date(e.erstellt_am)

      if (zeitraum === "heute") {
        return (
          datum.getFullYear() === jetzt.getFullYear() &&
          datum.getMonth() === jetzt.getMonth() &&
          datum.getDate() === jetzt.getDate()
        )
      }
      if (zeitraum === "woche") {
        const diffInMs = jetzt - datum  // Differenz in Millisekunden
        const diffInTagen = diffInMs / (1000 * 60 * 60 * 24)  // umrechnen in Tage
        return diffInTagen <= 7
      }
      if (zeitraum === "monat") {
        return (
          datum.getMonth() === jetzt.getMonth() &&
          datum.getFullYear() === jetzt.getFullYear()
        )
      }
      if (zeitraum === "jahr") {
        return (
          datum.getFullYear() === jetzt.getFullYear()
        )
      }
    })

    setSummeAusgaben(gefilterteAusgaben.reduce((sum, e) => sum + e.betrag, 0))
    setSummeEinnahmen(gefilterteEinnahmen.reduce((sum, e) => sum + e.betrag, 0))
  }

  const berechneDiagrammDaten = () => {
    const jetzt = new Date()
    let punkte = []

    if (zeitraum === "heute") {
      for (let i = 0; i < 24; i++) {
        const einnahmen = eintraege
          .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am.replace(" ", "T")).getHours() === i &&
            new Date(e.erstellt_am.replace(" ", "T")).getDate() === jetzt.getDate())
          .reduce((sum, e) => sum + e.betrag, 0)
        const ausgaben = eintraege
          .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am.replace(" ", "T")).getHours() === i &&
            new Date(e.erstellt_am.replace(" ", "T")).getDate() === jetzt.getDate())
          .reduce((sum, e) => sum + e.betrag, 0)
        punkte.push({ label: `${i}:00`, einnahmen, ausgaben })
      }
    }

    if (zeitraum === "woche") {
      // letzte 7 Tage
      for (let i = 6; i >= 0; i--) {
        const tag = new Date()
        tag.setDate(jetzt.getDate() - i)
        const einnahmen = eintraege
          .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getDate() === tag.getDate() &&
            new Date(e.erstellt_am).getMonth() === tag.getMonth())
          .reduce((sum, e) => sum + e.betrag, 0)
        const ausgaben = eintraege
          .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getDate() === tag.getDate() &&
            new Date(e.erstellt_am).getMonth() === tag.getMonth())
          .reduce((sum, e) => sum + e.betrag, 0)
        punkte.push({ label: `${tag.getDate()}.`, einnahmen, ausgaben })
      }
    }

    if (zeitraum === "monat") {
      // alle Tage des aktuellen Monats
      const tageImMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate()
      for (let i = 1; i <= tageImMonat; i++) {
        const einnahmen = eintraege
          .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getDate() === i &&
            new Date(e.erstellt_am).getMonth() === jetzt.getMonth())
          .reduce((sum, e) => sum + e.betrag, 0)
        const ausgaben = eintraege
          .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getDate() === i &&
            new Date(e.erstellt_am).getMonth() === jetzt.getMonth())
          .reduce((sum, e) => sum + e.betrag, 0)
        punkte.push({ label: `${i}.`, einnahmen, ausgaben })
      }
    }

    if (zeitraum === "jahr") {
      // 12 Monate
      const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
      for (let i = 0; i < 12; i++) {
        const einnahmen = eintraege
          .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getMonth() === i &&
            new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear())
          .reduce((sum, e) => sum + e.betrag, 0)
        const ausgaben = eintraege
          .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getMonth() === i &&
            new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear())
          .reduce((sum, e) => sum + e.betrag, 0)
        punkte.push({ label: monate[i], einnahmen, ausgaben })
      }
    }

    setDiagrammDaten(punkte)
  }

  const berechneKreisDaten = () => {
    const jetzt = new Date()

    const zeitraumFilter = (e) => {
      const datum = new Date(e.erstellt_am)
      if (zeitraum === "heute") {
        return datum.getFullYear() === jetzt.getFullYear() &&
          datum.getMonth() === jetzt.getMonth() &&
          datum.getDate() === jetzt.getDate()
      }
      if (zeitraum === "woche") {
        const diffInTagen = (jetzt - datum) / (1000 * 60 * 60 * 24)
        return diffInTagen <= 7
      }
      if (zeitraum === "monat") {
        return datum.getMonth() === jetzt.getMonth() &&
          datum.getFullYear() === jetzt.getFullYear()
      }
      if (zeitraum === "jahr") {
        return datum.getFullYear() === jetzt.getFullYear()
      }
    }

    // Ausgaben gruppieren
    const gefilterteAusgaben = eintraege.filter(e => e.typ === "ausgabe" && zeitraumFilter(e))
    const ausgabenProKategorie = gefilterteAusgaben.reduce((acc, e) => {
      acc[e.kategorie] = (acc[e.kategorie] ?? 0) + e.betrag
      return acc
    }, {})
    setKreisDatenAusgaben(Object.entries(ausgabenProKategorie).map(([name, value]) => ({ name, value })))

    const gefilterteEinnahmen = eintraege.filter(e => e.typ === "einnahme" && zeitraumFilter(e))
    const einnahmenProKategorie = gefilterteEinnahmen.reduce((acc, e) => {
      acc[e.kategorie] = (acc[e.kategorie] ?? 0) + e.betrag
      return acc
    }, {})
    setKreisDatenEinnahmen(Object.entries(einnahmenProKategorie).map(([name, value]) => ({ name, value })))
  }

  return (
    <div>
      <h2>Haushaltsbuch</h2>



      <div>
        <h3>Aktuelles Kapital: {kapital.toFixed(2)} €</h3>
      </div>

      <div>
        <h4>Startkapital setzen</h4>
        <input
          placeholder={`Aktuell: ${startkapital.toFixed(2)} €`}
          type="number"
          value={neuesStartkapital}
          onChange={(e) => setNeuesStartkapital(e.target.value)}
        />
        <button onClick={startkapitalSpeichern}>Speichern</button>
      </div>

      <div>
        <h4>Ausgabe hinzufügen</h4>
        <input
          value={ausgabeBeschreibung}
          onChange={(e) => setAusgabeBeschreibung(e.target.value)}
          placeholder="Beschreibung"
        />
        <input
          value={ausgabeBetrag}
          onChange={(e) => setAusgabeBetrag(e.target.value)}
          placeholder="Betrag"
          type="number"
        />
        <select
          value={ausgabeKategorie}
          onChange={(e) => setAusgabeKategorie(e.target.value)}
        >
          <option value="">Kategorie wählen</option>
          {kategorien.map((k) => (
            <option key={k.id} value={k.name}>
              {k.name}
            </option>
          ))}
        </select>
        <button onClick={ausgabeHinzufuegen}>Ausgabe hinzufügen</button>
      </div>

      <div>
        <h4>Einnahme hinzufügen</h4>
        <input
          value={einnahmenBeschreibung}
          onChange={(e) => setEinnahmenBeschreibung(e.target.value)}
          placeholder="Beschreibung"
        />
        <input
          value={einnahmenBetrag}
          onChange={(e) => setEinnahmenBetrag(e.target.value)}
          placeholder="Betrag"
          type="number"
        />
        <select
          value={einnahmeKategorie}
          onChange={(e) => setEinnahmeKategorie(e.target.value)}
        >
          <option value="">Kategorie wählen</option>
          {kategorien.map((k) => (
            <option key={k.id} value={k.name}>
              {k.name}
            </option>
          ))}
        </select>
        <button onClick={einnahmeHinzufuegen}>Einnahme hinzufügen</button>
      </div>

      <div>
        <h4>Eigene Kategorie hinzufügen</h4>
        <input
          value={neueKategorie}
          onChange={(e) => setNeueKategorie(e.target.value)}
          placeholder="z.B. 🎮 Gaming"
        />
        <button onClick={kategorieHinzufuegen}>Kategorie hinzufügen</button>
      </div>
      {modalOffen && (
        <div style={{
          // Overlay: deckt die ganze Seite ab
          position: "fixed",    // bleibt immer an der gleichen Stelle, egal wie man scrollt
          top: 0, left: 0,      // startet oben links
          width: "100%", height: "100%",  // bedeckt die ganze Seite
          backgroundColor: "rgba(0,0,0,0.5)",  // schwarz mit 50% Transparenz
          display: "flex", alignItems: "center", justifyContent: "center"  // zentriert die Box
        }}>
          <div style={{
            // Modal Box: das eigentliche Fenster
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "300px"
          }}>
            {/* dein bisheriger Modal Inhalt hier */}

            <div>
              <h4>Eintrag bearbeiten</h4>
              <input
                value={editBeschreibung}
                onChange={(e) => setEditBeschreibung(e.target.value)}
                placeholder="Beschreibung"
              />
              <input
                value={editBetrag}
                onChange={(e) => setEditBetrag(e.target.value)}
                placeholder="Betrag"
                type="number"
              />
              <select
                value={editKategorie}
                onChange={(e) => setEditKategorie(e.target.value)}
              >
                <option value="">Kategorie wählen</option>
                {kategorien.map((k) => (
                  <option key={k.id} value={k.name}>
                    {k.name}
                  </option>
                ))}
              </select>
              <button onClick={() => eintragSpeichern(zuBearbeiten.id, zuBearbeiten.typ)}>Speichern</button>
              <button onClick={bearbeitenSchliessen}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}



      <div>
        <h4>Wiederkehrenden Eintrag hinzufügen</h4>
        <input
          value={beschreibungInter}
          onChange={(e) => setBeschreibungInter(e.target.value)}
          placeholder="Beschreibung"
        />
        <input
          value={betragInter}
          onChange={(e) => setBetragInter(e.target.value)}
          placeholder="Betrag"
          type="number"
        />
        <select value={typInter} onChange={(e) => setTypInter(e.target.value)}>
          <option value="">Typ wählen</option>
          <option value="ausgabe">Ausgabe</option>
          <option value="einnahme">Einnahme</option>
        </select>
        <select
          value={kategorieInter}
          onChange={(e) => setkategorieInter(e.target.value)}
        >
          <option value="">Kategorie wählen</option>
          {kategorien.map((k) => (
            <option key={k.id} value={k.name}>
              {k.name}
            </option>
          ))}
        </select>
        <select
          value={intervall}
          onChange={(e) => setIntervall(e.target.value)}
        >
          <option value="">Intervall wählen</option>
          <option value="täglich">Täglich</option>
          <option value="wöchentlich">Wöchentlich</option>
          <option value="monatlich">Monatlich</option>
          <option value="jährlich">Jährlich</option>
        </select>
        <button onClick={wiederkehrendHinzufuegen}>Hinzufügen</button>
      </div>

      <div>
        {/* Buttons */}
        <button onClick={() => setZeitraum("heute")}>Heute</button>
        <button onClick={() => setZeitraum("woche")}>Woche</button>
        <button onClick={() => setZeitraum("monat")}>Monat</button>
        <button onClick={() => setZeitraum("jahr")}>Jahr</button>

        {/* Anzeige */}
        <span>Einnahmen: {summeEinnahmen.toFixed(2)} €</span>
        <span>Ausgaben: {summeAusgaben.toFixed(2)} €</span>
      </div>

      <LineChart width={600} height={300} data={diagrammDaten}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="einnahmen" stroke="green" />
        <Line type="monotone" dataKey="ausgaben" stroke="red" />
      </LineChart>

      <div>
        <h4>Ausgaben pro Kategorie</h4>
        <PieChart width={300} height={300}>
          <Pie data={kreisDatenAusgaben} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
            {kreisDatenAusgaben.map((entry, index) => (
              <Cell key={index} fill={["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>

        <h4>Einnahmen pro Kategorie</h4>
        <PieChart width={300} height={300}>
          <Pie data={kreisDatenEinnahmen} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
            {kreisDatenEinnahmen.map((entry, index) => (
              <Cell key={index} fill={["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      <ul>
        {kategorien.map((e) => (
          <li key={e.id}>
            {e.name}
            {!e.ist_vordefiniert && (
              <button onClick={() => kategorieLoeschen(e.id, e.ist_vordefiniert)}>🗑️</button>
            )}
          </li>
        ))}
      </ul>
      <div>
        <button onClick={() => setTabellenZeitraum("heute")}>Heute</button>
        <button onClick={() => setTabellenZeitraum("woche")}>Woche</button>
        <button onClick={() => setTabellenZeitraum("monat")}>Monat</button>
        <button onClick={() => setTabellenZeitraum("jahr")}>Jahr</button>

        {/* Monat/Jahr Auswahl */}
        <select onChange={(e) => setTabellenMonat(parseInt(e.target.value))}>
          <option value="0">Januar</option>
          <option value="1">Februar</option>
          <option value="2">März</option>
          <option value="3">April</option>
          <option value="4">Mai</option>
          <option value="5">Juni</option>
          <option value="6">Juli</option>
          <option value="7">August</option>
          <option value="8">September</option>
          <option value="9">Oktober</option>
          <option value="10">November</option>
          <option value="11">Dezember</option>
        </select>

        <select onChange={(e) => {
          setTabellenMonat(parseInt(e.target.value))
          setTabellenZeitraum("spezifisch")  // ← automatisch wechseln
        }}>
          ...
        </select>

        <select onChange={(e) => {
          setTabellenJahr(parseInt(e.target.value))
          setTabellenZeitraum("spezifisch")
        }}>
          {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => new Date().getFullYear() - i).map(jahr => (
            <option key={jahr} value={jahr}>{jahr}</option>
          ))}
        </select>
      </div>
      {eintraege
        .filter(e => {
          const datum = new Date(e.erstellt_am)
          const jetzt = new Date()

          if (tabellenZeitraum === "heute") {
            return datum.getFullYear() === jetzt.getFullYear() &&
              datum.getMonth() === jetzt.getMonth() &&
              datum.getDate() === jetzt.getDate()
          }
          if (tabellenZeitraum === "woche") {
            const diffInTagen = (jetzt - datum) / (1000 * 60 * 60 * 24)
            return diffInTagen <= 7
          }
          if (tabellenZeitraum === "monat") {
            return (
              datum.getMonth() === jetzt.getMonth() &&
              datum.getFullYear() === jetzt.getFullYear()
            )
          }
          if (tabellenZeitraum === "jahr") {
            return datum.getFullYear() === jetzt.getFullYear()
          }
          if (tabellenZeitraum === "spezifisch") {
            return datum.getFullYear() === tabellenJahr &&
              datum.getMonth() === tabellenMonat
          }
        })
        .map((e) => (
          <li key={e.id + e.typ}>
            {e.beschreibung} ({e.kategorie}): {e.typ === "ausgabe" ? "-" : "+"}{e.betrag.toFixed(2)} €
            <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
            <button onClick={() => eintragLoeschen(e.id, e.typ)}>🗑️</button>
          </li>
        ))
      }
    </div>
  );
}