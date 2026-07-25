import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Zeiterfassung() {
  const [eintraege, setEintraege] = useState([]);
  const [ansicht, setAnsicht] = useState("tabelle"); // 'tabelle' oder 'cards'

  // Formular-States
  const [ticketNummer, setTicketNummer] = useState("");
  const [prozessName, setProzessName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [prioritaet, setPrioritaet] = useState("mittel");
  const [deadline, setDeadline] = useState("");
  const [bereich, setBereich] = useState("Entwicklung");
  const [notizen, setNotizen] = useState("");

  // Modal für Bearbeiten
  const [bearbeitenEintrag, setBearbeitenEintrag] = useState(null);

  useEffect(() => {
    ladeZeiterfassungen();
    ladeNaechsteTicketNummer();
  }, []);

  // Timer-Ticker für aktive Zeitmessung
  useEffect(() => {
    const interval = setInterval(() => {
      setEintraege((prev) =>
        prev.map((e) => {
          if (e.is_running && e.gestartet_am) {
            const diffSec = Math.floor((new Date() - new Date(e.gestartet_am)) / 1000);
            return { ...e, tempDauer: (e.dauer_sekunden || 0) + diffSec };
          }
          return e;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const ladeZeiterfassungen = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("zeiterfassung")
      .select("*")
      .eq("benutzer_id", user.id)
      .order("erstellt_am", { ascending: false });

    setEintraege(data || []);
  };

  const ladeNaechsteTicketNummer = async () => {
    const { data } = await supabase
      .from("zeiterfassung")
      .select("ticket_nummer")
      .order("erstellt_am", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && data.ticket_nummer) {
      const nummer = parseInt(data.ticket_nummer.replace(/\D/g, ""), 10);
      setTicketNummer(`TICK-${isNaN(nummer) ? 1 : nummer + 1}`);
    } else {
      setTicketNummer("TICK-1");
    }
  };

  const prozessErstellen = async (e) => {
    e.preventDefault();
    if (!ticketNummer || !prozessName) return;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("zeiterfassung").insert({
      benutzer_id: user.id,
      ticket_nummer: ticketNummer,
      prozess_name: prozessName,
      beschreibung,
      prioritaet,
      deadline: deadline || null,
      bereich,
      fortlaufende_notizen: notizen,
      status: "offen"
    });

    // Reset & Nächste Nummer
    setProzessName("");
    setBeschreibung("");
    setDeadline("");
    setNotizen("");
    ladeZeiterfassungen();
    ladeNaechsteTicketNummer();
  };

  const toggleTimer = async (eintrag) => {
    const jetzt = new Date().toISOString();

    if (eintrag.is_running) {
      const zusaetzlicheSekunden = Math.floor((new Date() - new Date(eintrag.gestartet_am)) / 1000);
      const neueDauer = (eintrag.dauer_sekunden || 0) + zusaetzlicheSekunden;

      await supabase
        .from("zeiterfassung")
        .update({
          is_running: false,
          dauer_sekunden: neueDauer,
          gestartet_am: null,
          end_zeit: jetzt,
          status: "in_bearbeitung"
        })
        .eq("id", eintrag.id);
    } else {
      await supabase
        .from("zeiterfassung")
        .update({
          is_running: true,
          gestartet_am: jetzt,
          start_zeit: eintrag.start_zeit || jetzt, // Setzt Startzeit beim ersten Start
          status: "in_bearbeitung"
        })
        .eq("id", eintrag.id);
    }
    ladeZeiterfassungen();
  };

  const eintragSpeichern = async () => {
    if (!bearbeitenEintrag) return;

    await supabase
      .from("zeiterfassung")
      .update({
        ticket_nummer: bearbeitenEintrag.ticket_nummer,
        prozess_name: bearbeitenEintrag.prozess_name,
        beschreibung: bearbeitenEintrag.beschreibung,
        prioritaet: bearbeitenEintrag.prioritaet,
        bereich: bearbeitenEintrag.bereich,
        deadline: bearbeitenEintrag.deadline || null,
        status: bearbeitenEintrag.status,
        fortlaufende_notizen: bearbeitenEintrag.fortlaufende_notizen
      })
      .eq("id", bearbeitenEintrag.id);

    setBearbeitenEintrag(null);
    ladeZeiterfassungen();
  };

  const eintragLoeschen = async (id) => {
    await supabase.from("zeiterfassung").delete().eq("id", id);
    ladeZeiterfassungen();
  };

  const formatierteZeit = (sekundenGesamt) => {
    const hrs = Math.floor((sekundenGesamt || 0) / 3600);
    const mins = Math.floor(((sekundenGesamt || 0) % 3600) / 60);
    const secs = (sekundenGesamt || 0) % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPrioFarbe = (prio) => {
    switch (prio) {
      case "dringend": return "#ef4444";
      case "hoch": return "#f97316";
      case "mittel": return "#eab308";
      default: return "#10b981";
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>⏱️ Zeiterfassung & Prozess-Tracking</h2>
        
        {/* Toggle für Ansicht */}
        <div>
          <button 
            onClick={() => setAnsicht("tabelle")} 
            style={{ padding: "8px 12px", marginRight: "8px", fontWeight: ansicht === "tabelle" ? "bold" : "normal" }}
          >
            📋 Tabelle
          </button>
          <button 
            onClick={() => setAnsicht("cards")} 
            style={{ padding: "8px 12px", fontWeight: ansicht === "cards" ? "bold" : "normal" }}
          >
            🎴 Karten
          </button>
        </div>
      </div>

      {/* --- FORMULAR: NEUEN PROZESS ANLEGEN --- */}
      <form onSubmit={prozessErstellen} style={{ display: "grid", gap: "12px", marginBottom: "32px", background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: "12px" }}>
          <input value={ticketNummer} onChange={(e) => setTicketNummer(e.target.value)} placeholder="Ticket" required />
          <input value={prozessName} onChange={(e) => setProzessName(e.target.value)} placeholder="Prozess Name" required />
          <select value={bereich} onChange={(e) => setBereich(e.target.value)}>
            <option value="Entwicklung">Entwicklung</option>
            <option value="Admin">Admin</option>
            <option value="Finanzen">Finanzen</option>
            <option value="Privat">Privat</option>
          </select>
          <select value={prioritaet} onChange={(e) => setPrioritaet(e.target.value)}>
            <option value="niedrig">🟢 Niedrig</option>
            <option value="mittel">🟡 Mittel</option>
            <option value="hoch">🟠 Hoch</option>
            <option value="dringend">🔴 Dringend</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <textarea value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="To-Do Details..." style={{ height: "60px" }} />
          <textarea value={notizen} onChange={(e) => setNotizen(e.target.value)} placeholder="Notizen / Wo stehe ich gerade?" style={{ height: "60px" }} />
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ fontSize: "14px" }}>Deadline:</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <button type="submit" style={{ marginLeft: "auto", padding: "8px 24px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            Anlegen
          </button>
        </div>
      </form>

      {/* --- ANSICHT 1: TABELLE --- */}
      {ansicht === "tabelle" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th>Prio</th>
                <th>Ticket & Bereich</th>
                <th>Prozess</th>
                <th>Notizen / Status-Info</th>
                <th>Deadline</th>
                <th>Zeit</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {eintraege.map((item) => {
                const aktuelleZeit = item.is_running ? item.tempDauer || item.dauer_sekunden : item.dauer_sekunden;
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td><span style={{ color: getPrioFarbe(item.prioritaet) }}>●</span></td>
                    <td>
                      <strong>{item.ticket_nummer}</strong>
                      <br /><small style={{ color: "#64748b" }}>{item.bereich}</small>
                    </td>
                    <td>
                      <strong>{item.prozess_name}</strong>
                      <br /><small>{item.beschreibung}</small>
                    </td>
                    <td style={{ maxWidth: "200px", fontSize: "12px", color: "#475569" }}>
                      {item.fortlaufende_notizen || "—"}
                    </td>
                    <td style={{ fontSize: "13px" }}>{item.deadline || "—"}</td>
                    <td style={{ fontFamily: "monospace", fontWeight: "bold" }}>{formatierteZeit(aktuelleZeit)}</td>
                    <td>
                      <button onClick={() => toggleTimer(item)} style={{ marginRight: "6px" }}>{item.is_running ? "⏹" : "▶"}</button>
                      <button onClick={() => setBearbeitenEintrag(item)} style={{ marginRight: "6px" }}>✏️</button>
                      <button onClick={() => eintragLoeschen(item.id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ANSICHT 2: KARTEN (CARDS) --- */}
      {ansicht === "cards" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {eintraege.map((item) => {
            const aktuelleZeit = item.is_running ? item.tempDauer || item.dauer_sekunden : item.dauer_sekunden;
            return (
              <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", background: "#fff", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>{item.bereich}</span>
                  <span style={{ color: getPrioFarbe(item.prioritaet), fontWeight: "bold", fontSize: "12px" }}>{item.prioritaet.toUpperCase()}</span>
                </div>
                
                <h4 style={{ margin: "0 0 4px 0" }}>{item.ticket_nummer}: {item.prozess_name}</h4>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0" }}>{item.beschreibung}</p>
                
                {item.fortlaufende_notizen && (
                  <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px", fontSize: "12px", marginBottom: "12px" }}>
                    📌 <strong>Stand:</strong> {item.fortlaufende_notizen}
                  </div>
                )}

                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                  📅 Deadline: {item.deadline || "Keine"} <br />
                  🕒 Start: {item.start_zeit ? new Date(item.start_zeit).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", pt: "8px" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: "16px" }}>{formatierteZeit(aktuelleZeit)}</span>
                  <div>
                    <button onClick={() => toggleTimer(item)} style={{ marginRight: "6px" }}>{item.is_running ? "⏹ Stop" : "▶ Start"}</button>
                    <button onClick={() => setBearbeitenEintrag(item)} style={{ marginRight: "6px" }}>✏️</button>
                    <button onClick={() => eintragLoeschen(item.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL: EINTRAG BEARBEITEN / ANPASSEN --- */}
      {bearbeitenEintrag && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", width: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3>Eintrag bearbeiten</h3>
            <input value={bearbeitenEintrag.ticket_nummer} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, ticket_nummer: e.target.value})} placeholder="Ticket" />
            <input value={bearbeitenEintrag.prozess_name} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, prozess_name: e.target.value})} placeholder="Name" />
            <textarea value={bearbeitenEintrag.beschreibung || ""} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, beschreibung: e.target.value})} placeholder="Beschreibung" />
            <textarea value={bearbeitenEintrag.fortlaufende_notizen || ""} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, fortlaufende_notizen: e.target.value})} placeholder="Notizen / Wo stehe ich?" />
            
            <div style={{ display: "flex", gap: "8px" }}>
              <select value={bearbeitenEintrag.prioritaet} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, prioritaet: e.target.value})}>
                <option value="niedrig">Niedrig</option>
                <option value="mittel">Mittel</option>
                <option value="hoch">Hoch</option>
                <option value="dringend">Dringend</option>
              </select>
              <input type="date" value={bearbeitenEintrag.deadline || ""} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, deadline: e.target.value})} />
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button onClick={eintragSpeichern} style={{ flex: 1, padding: "8px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px" }}>Speichern</button>
              <button onClick={() => setBearbeitenEintrag(null)} style={{ flex: 1, padding: "8px", background: "#cbd5e1", border: "none", borderRadius: "4px" }}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}