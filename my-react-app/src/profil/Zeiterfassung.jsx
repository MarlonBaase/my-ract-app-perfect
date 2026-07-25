import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Zeiterfassung() {
  const [eintraege, setEintraege] = useState([]);
  const [ansicht, setAnsicht] = useState("cards"); // 'cards' (Kanban) oder 'tabelle'

  // Formular-States
  const [ticketNummer, setTicketNummer] = useState("");
  const [prozessName, setProzessName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [prioritaet, setPrioritaet] = useState("mittel");
  const [deadline, setDeadline] = useState("");
  const [bereich, setBereich] = useState("Entwicklung");
  const [notizen, setNotizen] = useState("");

  // Filter-States
  const [filterBereich, setFilterBereich] = useState("alle");
  const [filterPrio, setFilterPrio] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");

  // Modal für Bearbeiten
  const [bearbeitenEintrag, setBearbeitenEintrag] = useState(null);

  const verfuegbareBereiche = ["Entwicklung", "Admin", "Finanzen", "Privat"];

  useEffect(() => {
    ladeZeiterfassungen();
    ladeNaechsteTicketNummer();
  }, []);

  // Live-Timer Ticker für aktive Zeitmessung
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

    // Reset & Nächste Nummer laden
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
          start_zeit: eintrag.start_zeit || jetzt,
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

  // Gefilterte Liste
  const gefilterteEintraege = eintraege.filter((e) => {
    const bereichMatch = filterBereich === "alle" || e.bereich === filterBereich;
    const prioMatch = filterPrio === "alle" || e.prioritaet === filterPrio;
    const statusMatch = filterStatus === "alle" || e.status === filterStatus;
    return bereichMatch && prioMatch && statusMatch;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* HEADER & ANSICHTS-TOGGLE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>⏱️ Zeiterfassung & Prozess-Tracking</h2>
        <div>
          <button 
            onClick={() => setAnsicht("cards")} 
            style={{ padding: "8px 12px", marginRight: "8px", fontWeight: ansicht === "cards" ? "bold" : "normal" }}
          >
            🎴 Kanban (Bereiche)
          </button>
          <button 
            onClick={() => setAnsicht("tabelle")} 
            style={{ padding: "8px 12px", fontWeight: ansicht === "tabelle" ? "bold" : "normal" }}
          >
            📋 Tabelle
          </button>
        </div>
      </div>

      {/* NEUEN PROZESS ANLEGEN */}
      <form onSubmit={prozessErstellen} style={{ display: "grid", gap: "12px", marginBottom: "24px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: "12px" }}>
          <input value={ticketNummer} onChange={(e) => setTicketNummer(e.target.value)} placeholder="Ticket" required style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
          <input value={prozessName} onChange={(e) => setProzessName(e.target.value)} placeholder="Prozess / Aufgabe Name" required style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
          <select value={bereich} onChange={(e) => setBereich(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
            {verfuegbareBereiche.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={prioritaet} onChange={(e) => setPrioritaet(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}>
            <option value="niedrig">🟢 Niedrig</option>
            <option value="mittel">🟡 Mittel</option>
            <option value="hoch">🟠 Hoch</option>
            <option value="dringend">🔴 Dringend</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <textarea value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="To-Do Details (Absätze möglich)..." style={{ height: "70px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
          <textarea value={notizen} onChange={(e) => setNotizen(e.target.value)} placeholder="Notizen / Wo stehe ich gerade?" style={{ height: "70px", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }} />
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ fontSize: "14px" }}>Deadline:</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }} />
          <button type="submit" style={{ marginLeft: "auto", padding: "8px 24px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            Prozess anlegen
          </button>
        </div>
      </form>

      {/* FILTERLEISTE */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <div>
          <label style={{ fontSize: "12px", display: "block", color: "#64748b" }}>Bereich:</label>
          <select value={filterBereich} onChange={(e) => setFilterBereich(e.target.value)} style={{ padding: "6px", borderRadius: "4px" }}>
            <option value="alle">Alle Bereiche</option>
            {verfuegbareBereiche.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "12px", display: "block", color: "#64748b" }}>Priorität:</label>
          <select value={filterPrio} onChange={(e) => setFilterPrio(e.target.value)} style={{ padding: "6px", borderRadius: "4px" }}>
            <option value="alle">Alle Prioritäten</option>
            <option value="dringend">🔴 Dringend</option>
            <option value="hoch">🟠 Hoch</option>
            <option value="mittel">🟡 Mittel</option>
            <option value="niedrig">🟢 Niedrig</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "12px", display: "block", color: "#64748b" }}>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "6px", borderRadius: "4px" }}>
            <option value="alle">Alle Status</option>
            <option value="offen">Offen</option>
            <option value="in_bearbeitung">In Bearbeitung</option>
            <option value="abgeschlossen">Abgeschlossen</option>
          </select>
        </div>
      </div>

      {/* ANSICHT 1: TABELLE */}
      {ansicht === "tabelle" && (
        <div style={{ overflowX: "auto", background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "8px" }}>Prio</th>
                <th style={{ padding: "8px" }}>Ticket & Bereich</th>
                <th style={{ padding: "8px" }}>Prozess</th>
                <th style={{ padding: "8px" }}>Notizen / Wo stehe ich?</th>
                <th style={{ padding: "8px" }}>Deadline</th>
                <th style={{ padding: "8px" }}>Zeit</th>
                <th style={{ padding: "8px", textAlign: "center" }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {gefilterteEintraege.map((item) => {
                const aktuelleZeit = item.is_running ? item.tempDauer || item.dauer_sekunden : item.dauer_sekunden;
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px" }}><span style={{ color: getPrioFarbe(item.prioritaet) }}>●</span></td>
                    <td style={{ padding: "8px" }}>
                      <strong>{item.ticket_nummer}</strong>
                      <br /><small style={{ color: "#64748b" }}>{item.bereich}</small>
                    </td>
                    <td style={{ padding: "8px" }}>
                      <strong>{item.prozess_name}</strong>
                      <br /><small style={{ whiteSpace: "pre-wrap", color: "#475569" }}>{item.beschreibung}</small>
                    </td>
                    <td style={{ padding: "8px", maxWidth: "250px", fontSize: "12px", color: "#334155", whiteSpace: "pre-wrap" }}>
                      {item.fortlaufende_notizen || "—"}
                    </td>
                    <td style={{ padding: "8px", fontSize: "13px" }}>{item.deadline || "—"}</td>
                    <td style={{ padding: "8px", fontFamily: "monospace", fontWeight: "bold" }}>{formatierteZeit(aktuelleZeit)}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <button onClick={() => toggleTimer(item)} style={{ marginRight: "6px", cursor: "pointer" }}>{item.is_running ? "⏹ Stop" : "▶ Start"}</button>
                      <button onClick={() => setBearbeitenEintrag(item)} style={{ marginRight: "6px", cursor: "pointer" }}>✏️</button>
                      <button onClick={() => eintragLoeschen(item.id)} style={{ cursor: "pointer" }}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ANSICHT 2: KANBAN-BOARD (KARTEN PRO BEREICH NEBENEINANDER) */}
      {ansicht === "cards" && (
        <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px" }}>
          {verfuegbareBereiche
            .filter(b => filterBereich === "alle" || filterBereich === b)
            .map((bereichsName) => {
              const bereichEintraege = gefilterteEintraege.filter(e => e.bereich === bereichsName);

              return (
                <div 
                  key={bereichsName} 
                  style={{ 
                    flex: "1", 
                    minWidth: "300px", 
                    background: "#f8fafc", 
                    borderRadius: "8px", 
                    padding: "12px",
                    border: "1px solid #e2e8f0"
                  }}
                >
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", borderBottom: "2px solid #cbd5e1", paddingBottom: "6px" }}>
                    📁 {bereichsName} ({bereichEintraege.length})
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {bereichEintraege.map((item) => {
                      const aktuelleZeit = item.is_running ? item.tempDauer || item.dauer_sekunden : item.dauer_sekunden;
                      return (
                        <div key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "bold", color: getPrioFarbe(item.prioritaet) }}>
                              ● {item.prioritaet.toUpperCase()}
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                              {item.status}
                            </span>
                          </div>

                          <h4 style={{ margin: "0 0 6px 0", fontSize: "14px" }}>{item.ticket_nummer}: {item.prozess_name}</h4>
                          
                          {item.beschreibung && (
                            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0", whiteSpace: "pre-wrap" }}>
                              {item.beschreibung}
                            </p>
                          )}

                          {item.fortlaufende_notizen && (
                            <div style={{ background: "#f1f5f9", padding: "8px", borderRadius: "4px", fontSize: "12px", marginBottom: "8px", whiteSpace: "pre-wrap", color: "#334155" }}>
                              📌 <strong>Stand:</strong>{"\n"}{item.fortlaufende_notizen}
                            </div>
                          )}

                          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "10px" }}>
                            📅 Deadline: {item.deadline || "Keine"}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                            <span style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: "14px" }}>
                              {formatierteZeit(aktuelleZeit)}
                            </span>
                            <div>
                              <button onClick={() => toggleTimer(item)} style={{ marginRight: "4px", padding: "4px 8px", cursor: "pointer" }}>
                                {item.is_running ? "⏹ Stop" : "▶ Start"}
                              </button>
                              <button onClick={() => setBearbeitenEintrag(item)} style={{ marginRight: "4px", padding: "4px 8px", cursor: "pointer" }}>✏️</button>
                              <button onClick={() => eintragLoeschen(item.id)} style={{ padding: "4px 8px", cursor: "pointer" }}>🗑️</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {bereichEintraege.length === 0 && (
                      <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", padding: "16px" }}>
                        Keine Aufgaben
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* MODAL: EINTRAG BEARBEITEN */}
      {bearbeitenEintrag && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", width: "450px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3>Eintrag bearbeiten</h3>
            
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={bearbeitenEintrag.ticket_nummer} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, ticket_nummer: e.target.value})} placeholder="Ticket" style={{ width: "100px", padding: "6px" }} />
              <input value={bearbeitenEintrag.prozess_name} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, prozess_name: e.target.value})} placeholder="Name" style={{ flex: 1, padding: "6px" }} />
            </div>

            <textarea value={bearbeitenEintrag.beschreibung || ""} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, beschreibung: e.target.value})} placeholder="Beschreibung" style={{ height: "60px", padding: "6px" }} />
            <textarea value={bearbeitenEintrag.fortlaufende_notizen || ""} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, fortlaufende_notizen: e.target.value})} placeholder="Notizen / Wo stehe ich?" style={{ height: "60px", padding: "6px" }} />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#64748b" }}>Bereich:</label>
                <select value={bearbeitenEintrag.bereich} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, bereich: e.target.value})} style={{ width: "100%", padding: "6px" }}>
                  {verfuegbareBereiche.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#64748b" }}>Status:</label>
                <select value={bearbeitenEintrag.status} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, status: e.target.value})} style={{ width: "100%", padding: "6px" }}>
                  <option value="offen">Offen</option>
                  <option value="in_bearbeitung">In Bearbeitung</option>
                  <option value="abgeschlossen">Abgeschlossen</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#64748b" }}>Priorität:</label>
                <select value={bearbeitenEintrag.prioritaet} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, prioritaet: e.target.value})} style={{ width: "100%", padding: "6px" }}>
                  <option value="niedrig">Niedrig</option>
                  <option value="mittel">Mittel</option>
                  <option value="hoch">Hoch</option>
                  <option value="dringend">Dringend</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#64748b" }}>Deadline:</label>
                <input type="date" value={bearbeitenEintrag.deadline || ""} onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, deadline: e.target.value})} style={{ width: "100%", padding: "6px" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button onClick={eintragSpeichern} style={{ flex: 1, padding: "8px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Speichern</button>
              <button onClick={() => setBearbeitenEintrag(null)} style={{ flex: 1, padding: "8px", background: "#cbd5e1", border: "none", borderRadius: "4px", cursor: "pointer" }}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}