import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

export default function Haushaltsbuch() {
  const [kapital, setKapital] = useState(0);
  const [eintraege, setEintraege] = useState([]);
  const [transaktionsBeschreibung, setTransaktionsBeschreibung] = useState("");
  const [transaktionsBetrag, setTransaktionsBetrag] = useState("");
  const [transaktionsKategorie, setTransaktionsKategorie] = useState("");
  const [transaktionsTyp, setTransaktionsTyp] = useState("");
  const [wiederkehrendaktiv, setWiederkehrendaktiv] = useState(false);
  const [assets, setAssets] = useState([]);
  const [ausgewaehltesAsset, setAusgewaehltesAsset] = useState("");
  const [kategorien, setKategorien] = useState([]);
  const [modalOffen, setModalOffen] = useState(false);
  const [modalTransaktion, setModalTransaktion] = useState(false);
  const [zuBearbeiten, setZuBearbeiten] = useState(null);
  const [editBeschreibung, setEditBeschreibung] = useState("");
  const [editBetrag, setEditBetrag] = useState("");
  const [editKategorie, setEditKategorie] = useState("");
  const [wiederkehrende, setWiederkehrende] = useState([]);
  const [intervall, setIntervall] = useState("");
  const [zeitraum, setZeitraum] = useState("monat");
  const [summeEinnahmen, setSummeEinnahmen] = useState(0);
  const [summeAusgaben, setSummeAusgaben] = useState(0);
  const [diagrammDaten, setDiagrammDaten] = useState([]);
  const [kreisDatenAusgaben, setKreisDatenAusgaben] = useState([]);
  const [kreisDatenEinnahmen, setKreisDatenEinnahmen] = useState([]);
  const [tabellenZeitraum, setTabellenZeitraum] = useState("monat");
  const [tabellenMonat, setTabellenMonat] = useState(new Date().getMonth());
  const [tabellenJahr, setTabellenJahr] = useState(new Date().getFullYear());

  useEffect(() => {
    const init = async () => {
      try {
        await ladeAlles();
        await ladeKategorien();
        await ladeAssets();
        const daten = await ladeWiederkehrende();
        console.log("Daten:", daten);
        await pruefeWiederkehrende(daten);
        await ladeAlles();
      } catch (err) {
        console.error("Fehler in init:", err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    berechneZeitraum();
    berechneDiagrammDaten();
    berechneKreisDaten();
  }, [zeitraum, eintraege]);

  const ladeAlles = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Ausgaben mit Joins laden
    const { data: ausgaben, error: ausgabenError } = await supabase
      .from("transaktionsprotokoll")
      .select(`
        *,
        asset!asset_id (asset_name, asset_typ),
        transaktionskategorie!kategorie_id (name)
      `)
      .eq("benutzer_id", user.id)
      .eq("typ", "ausgabe")
      .order("erstellt_am", { ascending: false });

    if (ausgabenError) {
      console.error("Supabase-Fehler Details:", ausgabenError.message, ausgabenError.details, ausgabenError.hint);
    }

    // 2. Einnahmen mit Joins laden
    const { data: einnahmen } = await supabase
      .from("transaktionsprotokoll")
      .select(`
        *,
        asset!asset_id (asset_name, asset_typ),
        transaktionskategorie!kategorie_id (name)
      `)
      .eq("benutzer_id", user.id)
      .eq("typ", "einnahme")
      .order("erstellt_am", { ascending: false });

    const gesamtAusgaben = ausgaben?.reduce((sum, e) => sum + e.betrag, 0) ?? 0;
    const gesamtEinnahmen = einnahmen?.reduce((sum, e) => sum + e.betrag, 0) ?? 0;
    setKapital(gesamtEinnahmen - gesamtAusgaben);

    const alle = [
      ...(ausgaben ?? []).map((e) => ({ ...e, typ: "ausgabe" })),
      ...(einnahmen ?? []).map((e) => ({ ...e, typ: "einnahme" })),
    ].sort((a, b) => new Date(b.erstellt_am) - new Date(a.erstellt_am));

    setEintraege(alle);
  };

  const transaktionHinzufuegen = async () => {
    if (!transaktionsBeschreibung || !transaktionsBetrag || !transaktionsKategorie || !transaktionsTyp) return;
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("transaktionsprotokoll").insert({
      benutzer_id: user.id,
      notizen: transaktionsBeschreibung,
      betrag: parseFloat(transaktionsBetrag),
      kategorie_id: transaktionsKategorie,
      asset_id: ausgewaehltesAsset || null,
      typ: transaktionsTyp
    });

    setTransaktionsBeschreibung("");
    setTransaktionsBetrag("");
    setTransaktionsKategorie("");
    setAusgewaehltesAsset("");
    setTransaktionsTyp("");
    setModalTransaktion(false);
    ladeAlles();
  };

  const ladeKategorien = async () => {
    const { data } = await supabase
      .from("transaktionskategorie")
      .select("*")
      .order("name", { ascending: true });

    if (data) setKategorien(data);
  };

  const ladeAssets = async () => {
    const { data } = await supabase
      .from("asset")
      .select("*")
      .order("asset_name", { ascending: true });

    if (data) setAssets(data);
  };

  const eintragLoeschen = async (id, typ) => {
    await supabase.from("transaktionsprotokoll").delete().eq("id", id);
    ladeAlles();
  };

  const bearbeitenOeffnen = (eintrag) => {
    setZuBearbeiten(eintrag);
    setEditBeschreibung(eintrag.notizen);
    setEditBetrag(eintrag.betrag);
    setEditKategorie(eintrag.kategorie_id);
    setModalOffen(true);
  };

  const bearbeitenSchliessen = () => {
    setModalOffen(false);
    setZuBearbeiten(null);
    setEditBeschreibung("");
    setEditBetrag("");
    setEditKategorie("");
  };

  const transaktionSchließen = () => {
    setModalTransaktion(false);
    ladeAlles();
  };

  const eintragSpeichern = async (id, typ) => {
    await supabase.from("transaktionsprotokoll").update({
      notizen: editBeschreibung,
      betrag: parseFloat(editBetrag),
      kategorie_id: editKategorie,
    }).eq("id", id);

    bearbeitenSchliessen();
    ladeAlles();
  };

  const ladeWiederkehrende = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("transaktionsprotokoll")
      .select("*")
      .eq("benutzer_id", user.id)
      .eq("wiederkehrend", true)
      .order("erstellt_am", { ascending: false });

    if (data) setWiederkehrende(data);
    return data ?? [];
  };

  const pruefeWiederkehrende = async (liste) => {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date();
    const heute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (const eintrag of liste) {
      if (eintrag.naechste_faelligkeit <= heute) {
        await supabase.from("transaktionsprotokoll").insert({
          benutzer_id: user.id,
          notizen: eintrag.notizen,
          betrag: parseFloat(eintrag.betrag),
          kategorie_id: eintrag.kategorie_id,
          asset_id: eintrag.asset_id,
          typ: eintrag.typ
        });

        const parts = eintrag.naechste_faelligkeit.split("-");
        const naechsteDatum = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

        if (eintrag.intervall === "täglich") naechsteDatum.setDate(naechsteDatum.getDate() + 1);
        if (eintrag.intervall === "wöchentlich") naechsteDatum.setDate(naechsteDatum.getDate() + 7);
        if (eintrag.intervall === "monatlich") naechsteDatum.setMonth(naechsteDatum.getMonth() + 1);
        if (eintrag.intervall === "jährlich") naechsteDatum.setFullYear(naechsteDatum.getFullYear() + 1);

        const neuesFaelligkeitsDatum = `${naechsteDatum.getFullYear()}-${String(naechsteDatum.getMonth() + 1).padStart(2, '0')}-${String(naechsteDatum.getDate()).padStart(2, '0')}`;

        await supabase.from("transaktionsprotokoll")
          .update({ naechste_faelligkeit: neuesFaelligkeitsDatum })
          .eq("id", eintrag.id)
          .eq("wiederkehrend", true);
      }
    }
  };

  const berechneZeitraum = () => {
    const jetzt = new Date();

    const gefilterteAusgaben = eintraege.filter(e => {
      if (e.typ !== "ausgabe") return false;
      const datum = new Date(e.erstellt_am);

      if (zeitraum === "heute") {
        return (
          datum.getFullYear() === jetzt.getFullYear() &&
          datum.getMonth() === jetzt.getMonth() &&
          datum.getDate() === jetzt.getDate()
        );
      }
      if (zeitraum === "woche") {
        const diffInTagen = (jetzt - datum) / (1000 * 60 * 60 * 24);
        return diffInTagen <= 7;
      }
      if (zeitraum === "monat") {
        return (
          datum.getMonth() === jetzt.getMonth() &&
          datum.getFullYear() === jetzt.getFullYear()
        );
      }
      if (zeitraum === "jahr") {
        return datum.getFullYear() === jetzt.getFullYear();
      }
    });

    const gefilterteEinnahmen = eintraege.filter(e => {
      if (e.typ !== "einnahme") return false;
      const datum = new Date(e.erstellt_am);

      if (zeitraum === "heute") {
        return (
          datum.getFullYear() === jetzt.getFullYear() &&
          datum.getMonth() === jetzt.getMonth() &&
          datum.getDate() === jetzt.getDate()
        );
      }
      if (zeitraum === "woche") {
        const diffInTagen = (jetzt - datum) / (1000 * 60 * 60 * 24);
        return diffInTagen <= 7;
      }
      if (zeitraum === "monat") {
        return (
          datum.getMonth() === jetzt.getMonth() &&
          datum.getFullYear() === jetzt.getFullYear()
        );
      }
      if (zeitraum === "jahr") {
        return datum.getFullYear() === jetzt.getFullYear();
      }
    });

    setSummeAusgaben(gefilterteAusgaben.reduce((sum, e) => sum + e.betrag, 0));
    setSummeEinnahmen(gefilterteEinnahmen.reduce((sum, e) => sum + e.betrag, 0));
  };

  const berechneDiagrammDaten = () => {
    const jetzt = new Date();
    let punkte = [];

    if (zeitraum === "heute") {
      for (let i = 0; i < 24; i++) {
        const einnahmen = eintraege
          .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am.replace(" ", "T")).getHours() === i &&
            new Date(e.erstellt_am.replace(" ", "T")).getDate() === jetzt.getDate())
          .reduce((sum, e) => sum + e.betrag, 0);
        const ausgaben = eintraege
          .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am.replace(" ", "T")).getHours() === i &&
            new Date(e.erstellt_am.replace(" ", "T")).getDate() === jetzt.getDate())
          .reduce((sum, e) => sum + e.betrag, 0);
        punkte.push({ label: `${i}:00`, einnahmen, ausgaben });
      }
    }

    if (zeitraum === "woche") {
      for (let i = 6; i >= 0; i--) {
        const tag = new Date();
        tag.setDate(jetzt.getDate() - i);
        const einnahmen = eintraege
          .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getDate() === tag.getDate() &&
            new Date(e.erstellt_am).getMonth() === tag.getMonth())
          .reduce((sum, e) => sum + e.betrag, 0);
        const ausgaben = eintraege
          .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getDate() === tag.getDate() &&
            new Date(e.erstellt_am).getMonth() === tag.getMonth())
          .reduce((sum, e) => sum + e.betrag, 0);
        punkte.push({ label: `${tag.getDate()}.`, einnahmen, ausgaben });
      }
    }

    if (zeitraum === "monat") {
      const tageImMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= tageImMonat; i++) {
        const einnahmen = eintraege
          .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getDate() === i &&
            new Date(e.erstellt_am).getMonth() === jetzt.getMonth())
          .reduce((sum, e) => sum + e.betrag, 0);
        const ausgaben = eintraege
          .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getDate() === i &&
            new Date(e.erstellt_am).getMonth() === jetzt.getMonth())
          .reduce((sum, e) => sum + e.betrag, 0);
        punkte.push({ label: `${i}.`, einnahmen, ausgaben });
      }
    }

    if (zeitraum === "jahr") {
      const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
      for (let i = 0; i < 12; i++) {
        const einnahmen = eintraege
          .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getMonth() === i &&
            new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear())
          .reduce((sum, e) => sum + e.betrag, 0);
        const ausgaben = eintraege
          .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getMonth() === i &&
            new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear())
          .reduce((sum, e) => sum + e.betrag, 0);
        punkte.push({ label: monate[i], einnahmen, ausgaben });
      }
    }

    setDiagrammDaten(punkte);
  };

  const berechneKreisDaten = () => {
    const jetzt = new Date();

    const zeitraumFilter = (e) => {
      const datum = new Date(e.erstellt_am);
      if (zeitraum === "heute") {
        return datum.getFullYear() === jetzt.getFullYear() &&
          datum.getMonth() === jetzt.getMonth() &&
          datum.getDate() === jetzt.getDate();
      }
      if (zeitraum === "woche") {
        const diffInTagen = (jetzt - datum) / (1000 * 60 * 60 * 24);
        return diffInTagen <= 7;
      }
      if (zeitraum === "monat") {
        return datum.getMonth() === jetzt.getMonth() &&
          datum.getFullYear() === jetzt.getFullYear();
      }
      if (zeitraum === "jahr") {
        return datum.getFullYear() === jetzt.getFullYear();
      }
    };

    const gefilterteAusgaben = eintraege.filter(e => e.typ === "ausgabe" && zeitraumFilter(e));
    const ausgabenProKategorie = gefilterteAusgaben.reduce((acc, e) => {
      const katName = e.transaktionskategorie?.name || "Keine Kategorie";
      acc[katName] = (acc[katName] ?? 0) + e.betrag;
      return acc;
    }, {});
    setKreisDatenAusgaben(Object.entries(ausgabenProKategorie).map(([name, value]) => ({ name, value })));

    const gefilterteEinnahmen = eintraege.filter(e => e.typ === "einnahme" && zeitraumFilter(e));
    const einnahmenProKategorie = gefilterteEinnahmen.reduce((acc, e) => {
      const katName = e.transaktionskategorie?.name || "Keine Kategorie";
      acc[katName] = (acc[katName] ?? 0) + e.betrag;
      return acc;
    }, {});
    setKreisDatenEinnahmen(Object.entries(einnahmenProKategorie).map(([name, value]) => ({ name, value })));
  };

  return (
    <div className="app-container">
      <h1 className="Haushaltsbuch-title">Haushaltsbuch</h1>

      <div className="uebersicht">
        
        {/* --- 1. KARTEN-GRID (ZAHLEN) --- */}
        <div className="zahlen">
          <div className="zahl">
            <small>Aktuelles Kapital</small>
            <strong style={{ color: kapital < 0 ? '#ef4444' : '#10b981' }}>
              {kapital.toFixed(2)} €
            </strong>
          </div>
          <div className="zahl">
            <small>Einnahmen</small>
            <strong style={{ color: '#10b981' }}>{summeEinnahmen.toFixed(2)} €</strong>
          </div>
          <div className="zahl">
            <small>Ausgaben</small>
            <strong style={{ color: '#ef4444' }}>{summeAusgaben.toFixed(2)} €</strong>
          </div>
        </div>

        {/* --- 2. DIAGRAMME-GRID --- */}
        <div className="diagramme">
          {/* Liniendiagramm */}
          <div className="diagramm">
            <LineChart width={400} height={200} data={diagrammDaten}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="einnahmen" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="ausgaben" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
            
            <div className="zeitraum">
              <button className={zeitraum === "heute" ? "active" : ""} onClick={() => setZeitraum("heute")}>Heute</button>
              <button className={zeitraum === "woche" ? "active" : ""} onClick={() => setZeitraum("woche")}>Woche</button>
              <button className={zeitraum === "monat" ? "active" : ""} onClick={() => setZeitraum("monat")}>Monat</button>
              <button className={zeitraum === "jahr" ? "active" : ""} onClick={() => setZeitraum("jahr")}>Jahr</button>
            </div>
          </div>

          {/* Einnahmen-Kuchen */}
          <div className="diagramm">
            <h4>Einnahmen pro Kategorie</h4>
            {kreisDatenEinnahmen.length > 0 ? (
              <PieChart width={250} height={220}>
                <Pie data={kreisDatenEinnahmen} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {kreisDatenEinnahmen.map((entry, index) => (
                    <Cell key={index} fill={["#10b981", "#3b82f6", "#f59e0b", "#06b6d4", "#8b5cf6"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <div style={{ margin: "auto", color: "#a0aec0", fontSize: "14px" }}>Keine Daten</div>
            )}
          </div>

          {/* Ausgaben-Kuchen */}
          <div className="diagramm">
            <h4>Ausgaben pro Kategorie</h4>
            {kreisDatenAusgaben.length > 0 ? (
              <PieChart width={250} height={220}>
                <Pie data={kreisDatenAusgaben} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {kreisDatenAusgaben.map((entry, index) => (
                    <Cell key={index} fill={["#ef4444", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <div style={{ margin: "auto", color: "#a0aec0", fontSize: "14px" }}>Keine Daten</div>
            )}
          </div>
        </div>
      </div>

      {/* --- 3. AKTIONSLEISTE --- */}
      <div className="aktionen">
        <button onClick={() => setModalTransaktion(true)}>Transaktion hinzufügen</button>
        <div className="aktionen-filter">
          <div className="zeitraum">
            <button className={tabellenZeitraum === "heute" ? "active" : ""} onClick={() => setTabellenZeitraum("heute")}>Heute</button>
            <button className={tabellenZeitraum === "woche" ? "active" : ""} onClick={() => setTabellenZeitraum("woche")}>Woche</button>
            <button className={tabellenZeitraum === "monat" ? "active" : ""} onClick={() => setTabellenZeitraum("monat")}>Monat</button>
            <button className={tabellenZeitraum === "jahr" ? "active" : ""} onClick={() => setTabellenZeitraum("jahr")}>Jahr</button>
          </div>

          <select value={tabellenMonat} onChange={(e) => {
            setTabellenMonat(parseInt(e.target.value));
            setTabellenZeitraum("spezifisch");
          }}>
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

          <select value={tabellenJahr} onChange={(e) => {
            setTabellenJahr(parseInt(e.target.value));
            setTabellenZeitraum("spezifisch");
          }}>
            {Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => new Date().getFullYear() - i).map(jahr => (
              <option key={jahr} value={jahr}>{jahr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- 4. DATA TABLE --- */}
      <div className="eintrag-tabelle">
        <table>
          <thead>
            <tr>
              <th>Notizen</th>
              <th>Kategorie</th>
              <th style={{ textAlign: 'right' }}>Betrag</th>
              <th>Asset</th>
              <th style={{ textAlign: 'center' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {eintraege
              .filter(e => {
                const datum = new Date(e.erstellt_am);
                const jetzt = new Date();

                if (tabellenZeitraum === "heute") {
                  return datum.getFullYear() === jetzt.getFullYear() &&
                    datum.getMonth() === jetzt.getMonth() &&
                    datum.getDate() === jetzt.getDate();
                }
                if (tabellenZeitraum === "woche") {
                  const diffInTagen = (jetzt - datum) / (1000 * 60 * 60 * 24);
                  return diffInTagen <= 7;
                }
                if (tabellenZeitraum === "monat") {
                  return (
                    datum.getMonth() === jetzt.getMonth() &&
                    datum.getFullYear() === jetzt.getFullYear()
                  );
                }
                if (tabellenZeitraum === "jahr") {
                  return datum.getFullYear() === jetzt.getFullYear();
                }
                if (tabellenZeitraum === "spezifisch") {
                  return datum.getFullYear() === tabellenJahr &&
                    datum.getMonth() === tabellenMonat;
                }
                return true;
              })
              .map((e) => (
                <tr key={e.id + e.typ}>
                  <td>{e.notizen}</td>
                  <td>{e.transaktionskategorie?.name || "Keine Kategorie"}</td>
                  <td style={{ 
                    textAlign: 'right', 
                    fontWeight: '600', 
                    color: e.typ === "ausgabe" ? "#ef4444" : "#10b981" 
                  }}>
                    {e.typ === "ausgabe" ? "-" : "+"}{e.betrag.toFixed(2)} €
                  </td>
                  <td>{e.asset ? `[${e.asset.asset_typ}: ${e.asset.asset_name}]` : "—"}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => bearbeitenOeffnen(e)} style={{ border: 'none', background: 'none', cursor: 'pointer', marginRight: '8px' }}>✏️</button>
                    <button onClick={() => eintragLoeschen(e.id, e.typ)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* --- 5. MODAL: TRANSAKTION HINZUFÜGEN --- */}
      {modalTransaktion && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            minWidth: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}>
            <h4 style={{ marginBottom: "8px", fontWeight: "600" }}>Transaktion hinzufügen</h4>
            <input
              value={transaktionsBeschreibung}
              onChange={(e) => setTransaktionsBeschreibung(e.target.value)}
              placeholder="Beschreibung"
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
            <input
              value={transaktionsBetrag}
              onChange={(e) => setTransaktionsBetrag(e.target.value)}
              placeholder="Betrag"
              type="number"
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
            <select
              value={transaktionsKategorie}
              onChange={(e) => setTransaktionsKategorie(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              <option value="">Kategorie wählen</option>
              {kategorien.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
            <select 
              value={transaktionsTyp} 
              onChange={(e) => setTransaktionsTyp(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              <option value="">Typ wählen</option>
              <option value="ausgabe">Ausgabe</option>
              <option value="einnahme">Einnahme</option>
            </select>
            <select
              value={ausgewaehltesAsset}
              onChange={(e) => setAusgewaehltesAsset(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              <option value="">Asset wählen</option>
              {assets.map((a) => (
                <option key={a.asset_id} value={a.asset_id}>
                  {a.asset_typ} | {a.asset_name}
                </option>
              ))}
            </select>
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="wiederkehrend"
                checked={wiederkehrendaktiv}
                onChange={(e) => setWiederkehrendaktiv(e.target.checked)}
              />
              <label htmlFor="wiederkehrend">Wiederkehrend</label>
            </div>

            {wiederkehrendaktiv && (
              <select
                value={intervall}
                onChange={(e) => setIntervall(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="">Intervall wählen</option>
                <option value="täglich">Täglich</option>
                <option value="wöchentlich">Wöchentlich</option>
                <option value="monatlich">Monatlich</option>
                <option value="jährlich">Jährlich</option>
              </select>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button 
                onClick={transaktionHinzufuegen}
                style={{ flex: 1, padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Hinzufügen
              </button>
              <button 
                onClick={transaktionSchließen}
                style={{ flex: 1, padding: "10px", backgroundColor: "#e2e8f0", color: "#475569", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 6. MODAL: EINTRAG BEARBEITEN --- */}
      {modalOffen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            minWidth: "300px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}>
            <h4 style={{ fontWeight: "600" }}>Eintrag bearbeiten</h4>
            <input
              value={editBeschreibung}
              onChange={(e) => setEditBeschreibung(e.target.value)}
              placeholder="Beschreibung"
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
            <input
              value={editBetrag}
              onChange={(e) => setEditBetrag(e.target.value)}
              placeholder="Betrag"
              type="number"
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
            <select
              value={editKategorie}
              onChange={(e) => setEditKategorie(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              <option value="">Kategorie wählen</option>
              {kategorien.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button 
                onClick={() => eintragSpeichern(zuBearbeiten.id, zuBearbeiten.typ)}
                style={{ flex: 1, padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Speichern
              </button>
              <button 
                onClick={bearbeitenSchliessen}
                style={{ flex: 1, padding: "10px", backgroundColor: "#e2e8f0", color: "#475569", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}