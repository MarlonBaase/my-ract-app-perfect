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

  useEffect(() => {
    ladeAlles();
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
    if (!beschreibung || !betrag) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("haushaltsbuch").insert({
      user_id: user.id,
      beschreibung,
      betrag: parseFloat(betrag),
    });
    setBeschreibung("");
    setBetrag("");
    ladeAlles();
  };

  const einnahmeHinzufuegen = async () => {
    if (!einnahmenBeschreibung || !einnahmenBetrag) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("einnahmen").insert({
      user_id: user.id,
      beschreibung: einnahmenBeschreibung,
      betrag: parseFloat(einnahmenBetrag),
    });
    setEinnahmenBeschreibung("");
    setEinnahmenBetrag("");
    ladeAlles();
  };

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
        <button onClick={einnahmeHinzufuegen}>Einnahme hinzufügen</button>
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