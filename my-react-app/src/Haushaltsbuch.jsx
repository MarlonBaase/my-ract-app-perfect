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

  useEffect(() => {
    ladeAlles();
    ladeKategorien();
  }, []);

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
      .order("erstellt_am", { ascending: false });

    const { data: einnahmen } = await supabase
      .from("einnahmen")
      .select("*")
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

      <ul>
        {eintraege.map((e) => (
          <li key={e.id + e.typ}>
            {e.beschreibung}: {e.typ === "ausgabe" ? "-" : "+"}{e.betrag.toFixed(2)} €
          </li>
        ))}
      </ul>
    </div>
  );
}