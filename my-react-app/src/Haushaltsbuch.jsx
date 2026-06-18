import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Haushaltsbuch() {
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

  useEffect(() => {
    const init = async () => {
      await ladeAlles()
      await ladeKategorien()
      const daten = await ladeWiederkehrende()
      await pruefeWiederkehrende(daten)  // ← direkt übergeben
      await ladeAlles() // nochmal laden damit neue Buchungen sichtbar sind
    }
    init()
  }, [])

  const ladeAlles = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: kapitalData } = await supabase
      .from("kapital")
      .select("betrag")
      .eq("user_id", user.id)
      .single();

    const start = kapitalData?.betrag ?? 0;
    setStartkapital(start);

    const { data: ausgaben } = await supabase
      .from("haushaltsbuch")
      .select("*")
      .eq("user_id", user.id)  // ← fehlt noch
      .order("erstellt_am", { ascending: false });

    const { data: einnahmen } = await supabase
      .from("einnahmen")
      .select("*")
      .eq("user_id", user.id)  // ← fehlt noch
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
    await supabase.from("kapital").upsert(
      {
        user_id: user.id,
        betrag: parseFloat(neuesStartkapital),
      },
      { onConflict: "user_id" }
    );
    setNeuesStartkapital("");
    ladeAlles();
  };

  const ausgabeHinzufuegen = async () => {
    if (!beschreibung || !betrag || !ausgabeKategorie) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("haushaltsbuch").insert({
      user_id: user.id,
      beschreibung,
      betrag: parseFloat(betrag),
      kategorie: ausgabeKategorie
    })
    setBeschreibung("")
    setBetrag("")
    setAusgabeKategorie("")
    ladeAlles()
  }

  const einnahmeHinzufuegen = async () => {
    if (!einnahmenBeschreibung || !einnahmenBetrag || !einnahmeKategorie) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("einnahmen").insert({
      user_id: user.id,
      beschreibung: einnahmenBeschreibung,
      betrag: parseFloat(einnahmenBetrag),
      kategorie: einnahmeKategorie
    })
    setEinnahmenBeschreibung("")
    setEinnahmenBetrag("")
    setEinnahmeKategorie("")
    ladeAlles()
  }

  const ladeKategorien = async () => {
    const { data } = await supabase
      .from("kategorien")
      .select("*")
      .order("name", { ascending: true })

    if (data) setKategorien(data)
  }

  const kategorieHinzufuegen = async () => {
    if (!neueKategorie) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("kategorien").insert({
      user_id: user.id,
      name: neueKategorie,
      ist_vordefiniert: false
    })
    setNeueKategorie("")
    ladeKategorien()
  }


  const eintragLoeschen = async (id, typ) => {
    if (typ === "ausgabe") {
      await supabase.from("haushaltsbuch").delete().eq("id", id)
    }
    if (typ === "einnahme") {
      await supabase.from("einnahmen").delete().eq("id", id)
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
      await supabase.from("haushaltsbuch").update({
        beschreibung: editBeschreibung,
        betrag: parseFloat(editBetrag),
        kategorie: editKategorie
      }).eq("id", id)
    }
    if (typ === "einnahme") {
      await supabase.from("einnahmen").update({
        beschreibung: editBeschreibung,
        betrag: parseFloat(editBetrag),
        kategorie: editKategorie
      }).eq("id", id)
    }
    bearbeitenSchliessen()
    ladeAlles()
  }

  const ladeWiederkehrende = async () => {
    const { data } = await supabase
      .from("wiederkehrend")
      .select("*")
      .order("erstellt_am", { ascending: false })

    if (data) setWiederkehrende(data)
    return data ?? []  // ← zurückgeben!
  }

  const wiederkehrendHinzufuegen = async () => {
    if (!beschreibungInter || !betragInter || !kategorieInter || !typInter || !intervall) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("wiederkehrend").insert({
      user_id: user.id,
      beschreibung: beschreibungInter,  // Spaltenname: Wert
      betrag: parseFloat(betragInter),  // betragInter nicht betrag!
      kategorie: kategorieInter,
      typ: typInter,
      intervall: intervall,
      naechste_faelligkeit: new Date().toISOString().split("T")[0]  // vergessen!
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
    const heute = new Date().toISOString().split("T")[0]

    for (const eintrag of liste) {
      if (eintrag.naechste_faelligkeit <= heute) {
        if (eintrag.typ === "ausgabe") {
          await supabase.from("haushaltsbuch").insert({
            user_id: user.id,
            beschreibung: eintrag.beschreibung,
            betrag: parseFloat(eintrag.betrag),
            kategorie: eintrag.kategorie
          })
        }
        if (eintrag.typ === "einnahme") {
          await supabase.from("einnahmen").insert({
            user_id: user.id,
            beschreibung: eintrag.beschreibung,
            betrag: parseFloat(eintrag.betrag),
            kategorie: eintrag.kategorie
          })
        }
        const naechsteDatum = new Date(eintrag.naechste_faelligkeit)

        if (eintrag.intervall === "wöchentlich") naechsteDatum.setDate(naechsteDatum.getDate() + 7)
        if (eintrag.intervall === "monatlich") naechsteDatum.setMonth(naechsteDatum.getMonth() + 1)
        if (eintrag.intervall === "jährlich") naechsteDatum.setFullYear(naechsteDatum.getFullYear() + 1)

        const neuesFaelligkeitsDatum = naechsteDatum.toISOString().split("T")[0]
        await supabase.from("wiederkehrend").update({ naechste_faelligkeit: neuesFaelligkeitsDatum }).eq("id", eintrag.id)
      }
    }
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
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          placeholder="Beschreibung"
        />
        <input
          value={betrag}
          onChange={(e) => setBetrag(e.target.value)}
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

      <ul>
        {eintraege.map((e) => (
          <li key={e.id + e.typ}>
            {e.beschreibung} ({e.kategorie}): {e.typ === "ausgabe" ? "-" : "+"}{e.betrag.toFixed(2)} €
            <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
            <button onClick={() => eintragLoeschen(e.id, e.typ)}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
}