import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Zeiterfassung() {
  const [eintraege, setEintraege] = useState([]);
  const [ansicht, setAnsicht] = useState("cards"); // 'cards' (Kanban) oder 'tabelle'

  // Formular-States
  const [ticketNummer, setTicketNummer] = useState(1);
  const [prozessName, setProzessName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [prioritaet, setPrioritaet] = useState("mittel");
  const [deadline, setDeadline] = useState("");
  const [bereich, setBereich] = useState("Aktiva_Liquidität&Geldmarkt");
  const [notizen, setNotizen] = useState("");

  // Filter-States
  const [filterBereich, setFilterBereich] = useState("alle");
  const [filterPrio, setFilterPrio] = useState("alle");
  const [filterStatus, setFilterStatus] = useState("alle");

  // Kanban Gruppierungs-Modus ('bereich', 'status' oder 'prio')
  const [kanbanGruppierung, setKanbanGruppierung] = useState("bereich");

  // State für Drag & Drop
  const [draggedItemId, setDraggedItemId] = useState(null);

  // Modal für Bearbeiten
  const [bearbeitenEintrag, setBearbeitenEintrag] = useState(null);

  // Standard-Bereiche + dynamisch erfasste aus den Einträgen
  const vordefinierteBereiche = [
    "Aktiva_Liquidität&Geldmarkt",
    "Aktiva_Wertpapiere&Derivate",
    "Aktiva_Immobilien&Sachwerte",
    "Aktiva_Web3&Krypto",
    "Aktiva_Buisness&forderungen",
    "Aktiva_Vorsorge&Verträge",
    "Passiva_Kredite&Schulden",
    "Hauptbereiche",
    "Begleitende Seite"
  ];

  const verfuegbareBereiche = Array.from(
    new Set([
      ...vordefinierteBereiche,
      ...eintraege.map((e) => e.bereich).filter(Boolean)
    ])
  );

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

    const { data, error } = await supabase
      .from("zeiterfassung")
      .select("*")
      .eq("benutzer_id", user.id)
      .order("erstellt_am", { ascending: false });

    if (error) {
      console.error("Fehler beim Laden der Zeiterfassungen:", error.message);
    } else {
      setEintraege(data || []);
    }
  };

  const ladeNaechsteTicketNummer = async () => {
    const { data } = await supabase
      .from("zeiterfassung")
      .select("ticket_nummer")
      .order("ticket_nummer", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && data.ticket_nummer !== undefined && data.ticket_nummer !== null) {
      const nummer = Number(data.ticket_nummer);
      setTicketNummer(isNaN(nummer) ? 1 : nummer + 1);
    } else {
      setTicketNummer(1);
    }
  };

  const prozessErstellen = async (e) => {
    e.preventDefault();
    if (!ticketNummer || !prozessName) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // KORREKTUR: "offen" als Standardwert für status verwenden, um Constraint-Fehler zu vermeiden
    const { error } = await supabase.from("zeiterfassung").insert({
      benutzer_id: user.id,
      ticket_nummer: Number(ticketNummer),
      prozess_name: prozessName,
      beschreibung: beschreibung || "",
      prioritaet: prioritaet || "mittel",
      deadline: deadline || null,
      bereich: bereich || "Hauptbereiche",
      fortlaufende_notizen: notizen || "",
      status: "offen" // Stelle sicher, dass 'offen' in der DB erlaubt ist (oder 'planung', falls in Supabase hinterlegt)
    });

    if (error) {
      console.error("Fehler beim Erstellen des Prozesses:", error.message, error.details);
      alert(`Fehler beim Speichern: ${error.message}`);
      return;
    }

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
          status: eintrag.status || "in_bearbeitung"
        })
        .eq("id", eintrag.id);
    } else {
      await supabase
        .from("zeiterfassung")
        .update({
          is_running: true,
          gestartet_am: jetzt,
          start_zeit: eintrag.start_zeit || jetzt,
          status: eintrag.status || "in_bearbeitung"
        })
        .eq("id", eintrag.id);
    }
    ladeZeiterfassungen();
  };

  const eintragSpeichern = async () => {
    if (!bearbeitenEintrag) return;

    const { error } = await supabase
      .from("zeiterfassung")
      .update({
        ticket_nummer: Number(bearbeitenEintrag.ticket_nummer),
        prozess_name: bearbeitenEintrag.prozess_name,
        beschreibung: bearbeitenEintrag.beschreibung,
        prioritaet: bearbeitenEintrag.prioritaet,
        bereich: bearbeitenEintrag.bereich,
        deadline: bearbeitenEintrag.deadline || null,
        status: bearbeitenEintrag.status || "offen",
        fortlaufende_notizen: bearbeitenEintrag.fortlaufende_notizen
      })
      .eq("id", bearbeitenEintrag.id);

    if (error) {
      console.error("Fehler beim Aktualisieren des Eintrags:", error.message);
      alert(`Fehler beim Aktualisieren: ${error.message}`);
    } else {
      setBearbeitenEintrag(null);
      ladeZeiterfassungen();
    }
  };

  const eintragLoeschen = async (id) => {
    await supabase.from("zeiterfassung").delete().eq("id", id);
    ladeZeiterfassungen();
  };

  // DRAG & DROP LOGIK
  const handleDragStart = (e, id) => {
    setDraggedItemId(id);
    e.dataTransfer.setData("text/plain", String(id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, zielSpaltenKey) => {
    e.preventDefault();
    const itemId = draggedItemId || e.dataTransfer.getData("text/plain");
    if (!itemId) return;

    const eintrag = eintraege.find((e) => String(e.id) === String(itemId));
    if (!eintrag) return;

    let updateData = {};
    if (kanbanGruppierung === "status") {
      updateData = { status: zielSpaltenKey };
    } else if (kanbanGruppierung === "prio") {
      updateData = { prioritaet: zielSpaltenKey };
    } else {
      updateData = { bereich: zielSpaltenKey };
    }

    setEintraege((prev) =>
      prev.map((item) =>
        String(item.id) === String(itemId) ? { ...item, ...updateData } : item
      )
    );

    const targetId = isNaN(Number(itemId)) ? itemId : Number(itemId);

    const { error } = await supabase.from("zeiterfassung").update(updateData).eq("id", targetId);

    if (error) {
      console.error("Fehler bei Drag&Drop Update:", error.message, error.details);
    }

    setDraggedItemId(null);
    ladeZeiterfassungen();
  };

  const formatierteZeit = (sekundenGesamt) => {
    const hrs = Math.floor((sekundenGesamt || 0) / 3600);
    const mins = Math.floor(((sekundenGesamt || 0) % 3600) / 60);
    const secs = (sekundenGesamt || 0) % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getPrioMeta = (prio) => {
    switch (prio) {
      case "dringend": return { farbe: "#ef4444", bg: "#fef2f2", label: "Dringend" };
      case "hoch": return { farbe: "#f97316", bg: "#fff7ed", label: "Hoch" };
      case "mittel": return { farbe: "#eab308", bg: "#fefce8", label: "Mittel" };
      default: return { farbe: "#10b981", bg: "#ecfdf5", label: "Niedrig" };
    }
  };

  const gefilterteEintraege = eintraege.filter((e) => {
    const bereichMatch = filterBereich === "alle" || String(e.bereich || "").toLowerCase() === filterBereich.toLowerCase();
    const prioMatch = filterPrio === "alle" || String(e.prioritaet || "").toLowerCase() === filterPrio.toLowerCase();
    const statusMatch = filterStatus === "alle" || String(e.status || "").toLowerCase() === filterStatus.toLowerCase();
    return bereichMatch && prioMatch && statusMatch;
  });

  const getKanbanSpalten = () => {
    if (kanbanGruppierung === "status") {
      return [
        { key: "offen", label: "🔓 Offen" },
        { key: "in_bearbeitung", label: "⚡ In Bearbeitung" },
        { key: "abgeschlossen", label: "✅ Abgeschlossen" }
      ];
    }
    if (kanbanGruppierung === "prio") {
      return [
        { key: "dringend", label: "🔴 Dringend" },
        { key: "hoch", label: "🟠 Hoch" },
        { key: "mittel", label: "🟡 Mittel" },
        { key: "niedrig", label: "🟢 Niedrig" }
      ];
    }
    return verfuegbareBereiche
      .filter(b => filterBereich === "alle" || filterBereich.toLowerCase() === b.toLowerCase())
      .map(b => ({ key: b, label: `📁 ${b}` }));
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: "1600px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif", color: "#0f172a", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em" }}>⏱️ Zeiterfassung & Tracking</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>Verwalte deine Aufgaben, Zeiten und Fortschritte an einem Ort.</p>
        </div>
        <div style={{ display: "flex", gap: "6px", background: "#e2e8f0", padding: "4px", borderRadius: "10px" }}>
          <button 
            onClick={() => setAnsicht("cards")} 
            style={{ 
              padding: "8px 16px", 
              borderRadius: "8px", 
              border: "none", 
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              background: ansicht === "cards" ? "#ffffff" : "transparent",
              color: ansicht === "cards" ? "#0f172a" : "#64748b",
              boxShadow: ansicht === "cards" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
            }}
          >
            🎴 Kanban Board
          </button>
          <button 
            onClick={() => setAnsicht("tabelle")} 
            style={{ 
              padding: "8px 16px", 
              borderRadius: "8px", 
              border: "none", 
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              background: ansicht === "tabelle" ? "#ffffff" : "transparent",
              color: ansicht === "tabelle" ? "#0f172a" : "#64748b",
              boxShadow: ansicht === "tabelle" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
            }}
          >
            📋 Tabelle
          </button>
        </div>
      </div>

      {/* FORMULAR: NEUEN PROZESS ANLEGEN */}
      <form onSubmit={prozessErstellen} style={{ background: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "24px", display: "grid", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr 1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>Ticket-Nr.</label>
            <input 
              type="number" 
              value={ticketNummer} 
              onChange={(e) => setTicketNummer(Number(e.target.value))} 
              placeholder="1" 
              required 
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }} 
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>Prozess / Aufgaben Name</label>
            <input value={prozessName} onChange={(e) => setProzessName(e.target.value)} placeholder="Was möchtest du erledigen?" required style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>Bereich</label>
            <select value={bereich} onChange={(e) => setBereich(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#fff" }}>
              {verfuegbareBereiche.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>Priorität</label>
            <select value={prioritaet} onChange={(e) => setPrioritaet(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#fff" }}>
              <option value="niedrig">🟢 Niedrig</option>
              <option value="mittel">🟡 Mittel</option>
              <option value="hoch">🟠 Hoch</option>
              <option value="dringend">🔴 Dringend</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>Details & To-Dos</label>
            <textarea value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} placeholder="• Schritt 1&#10;• Schritt 2" style={{ width: "100%", height: "64px", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px", display: "block" }}>Fortschritts-Notizen</label>
            <textarea value={notizen} onChange={(e) => setNotizen(e.target.value)} placeholder="Aktueller Stand / Wo hänge ich gerade?" style={{ width: "100%", height: "64px", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Deadline:</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }} />
          </div>
          <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
            + Prozess anlegen
          </button>
        </div>
      </form>

      {/* FILTERLEISTE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", background: "#ffffff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Bereich:</span>
            <select value={filterBereich} onChange={(e) => setFilterBereich(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
              <option value="alle">Alle Bereiche</option>
              {verfuegbareBereiche.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Priorität:</span>
            <select value={filterPrio} onChange={(e) => setFilterPrio(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
              <option value="alle">Alle Prioritäten</option>
              <option value="dringend">🔴 Dringend</option>
              <option value="hoch">🟠 Hoch</option>
              <option value="mittel">🟡 Mittel</option>
              <option value="niedrig">🟢 Niedrig</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Status:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
              <option value="alle">Alle Status</option>
              <option value="offen">🔓 Offen</option>
              <option value="in_bearbeitung">⚡ In Bearbeitung</option>
              <option value="abgeschlossen">✅ Abgeschlossen</option>
            </select>
          </div>
        </div>

        {ansicht === "cards" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", padding: "4px 10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Spalten Gruppieren nach:</span>
            <label style={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <input type="radio" name="gruppierung" value="bereich" checked={kanbanGruppierung === "bereich"} onChange={() => setKanbanGruppierung("bereich")} />
              Bereich
            </label>
            <label style={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <input type="radio" name="gruppierung" value="status" checked={kanbanGruppierung === "status"} onChange={() => setKanbanGruppierung("status")} />
              Status
            </label>
            <label style={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
              <input type="radio" name="gruppierung" value="prio" checked={kanbanGruppierung === "prio"} onChange={() => setKanbanGruppierung("prio")} />
              Priorität
            </label>
          </div>
        )}
      </div>

      {/* TABELLE */}
      {ansicht === "tabelle" && (
        <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "12px", textTransform: "uppercase" }}>
                <th style={{ padding: "12px 16px" }}>Prio</th>
                <th style={{ padding: "12px 16px" }}>Ticket-Nr. & Bereich</th>
                <th style={{ padding: "12px 16px" }}>Prozess</th>
                <th style={{ padding: "12px 16px" }}>Notizen</th>
                <th style={{ padding: "12px 16px" }}>Deadline</th>
                <th style={{ padding: "12px 16px" }}>Zeit</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {gefilterteEintraege.map((item) => {
                const aktuelleZeit = item.is_running ? item.tempDauer || item.dauer_sekunden : item.dauer_sekunden;
                const prio = getPrioMeta(item.prioritaet);

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: prio.farbe }}></span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: "700" }}>#{item.ticket_nummer}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{item.bereich}</div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: "600" }}>{item.prozess_name}</div>
                      <div style={{ whiteSpace: "pre-wrap", color: "#64748b", fontSize: "13px" }}>{item.beschreibung}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#334155", whiteSpace: "pre-wrap" }}>
                      {item.fortlaufende_notizen || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                      {item.deadline || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "monospace", fontWeight: "700" }}>
                      {formatierteZeit(aktuelleZeit)}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button onClick={() => toggleTimer(item)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: item.is_running ? "#fef2f2" : "#f0fdf4", color: item.is_running ? "#dc2626" : "#16a34a", cursor: "pointer", marginRight: "8px" }}>
                        {item.is_running ? "⏹ Stopp" : "▶ Start"}
                      </button>
                      <button onClick={() => setBearbeitenEintrag(item)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", marginRight: "4px" }}>✏️</button>
                      <button onClick={() => eintragLoeschen(item.id)} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* KANBAN BOARD */}
      {ansicht === "cards" && (
        <div style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "16px", alignItems: "flex-start" }}>
          {getKanbanSpalten().map((spalte) => {
            const spaltenEintraege = gefilterteEintraege.filter((e) => {
              if (kanbanGruppierung === "status") {
                return String(e.status || "").toLowerCase() === spalte.key.toLowerCase();
              }
              if (kanbanGruppierung === "prio") {
                return String(e.prioritaet || "").toLowerCase() === spalte.key.toLowerCase();
              }
              return String(e.bereich || "").toLowerCase() === spalte.key.toLowerCase();
            });

            return (
              <div 
                key={spalte.key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, spalte.key)}
                style={{ flex: "0 0 320px", background: "#f1f5f9", borderRadius: "14px", padding: "16px", minHeight: "200px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#334155" }}>
                    {spalte.label}
                  </h3>
                  <span style={{ background: "#e2e8f0", color: "#475569", fontSize: "12px", fontWeight: "700", padding: "2px 8px", borderRadius: "12px" }}>
                    {spaltenEintraege.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {spaltenEintraege.map((item) => {
                    const aktuelleZeit = item.is_running ? item.tempDauer || item.dauer_sekunden : item.dauer_sekunden;
                    const prio = getPrioMeta(item.prioritaet);

                    return (
                      <div 
                        key={item.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        style={{ 
                          background: "#ffffff", 
                          borderRadius: "12px", 
                          padding: "16px", 
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                          borderLeft: `4px solid ${prio.farbe}`,
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          cursor: "grab",
                          opacity: draggedItemId === item.id ? 0.5 : 1
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: prio.farbe, background: prio.bg, padding: "2px 8px", borderRadius: "6px" }}>
                            {prio.label}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b", background: "#f8fafc", padding: "2px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                            📁 {item.bereich} | {item.status}
                          </span>
                        </div>

                        <div>
                          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700" }}>#{item.ticket_nummer}</div>
                          <h4 style={{ margin: "2px 0 0 0", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{item.prozess_name}</h4>
                        </div>

                        {item.beschreibung && (
                          <p style={{ fontSize: "12px", color: "#64748b", margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.4" }}>
                            {item.beschreibung}
                          </p>
                        )}

                        {item.fortlaufende_notizen && (
                          <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", fontSize: "12px", border: "1px solid #f1f5f9", color: "#334155", whiteSpace: "pre-wrap" }}>
                            📌 <strong>Stand:</strong>{"\n"}{item.fortlaufende_notizen}
                          </div>
                        )}

                        {item.deadline && (
                          <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: "500" }}>
                            📅 Deadline: {item.deadline}
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "10px", marginTop: "4px" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "14px", color: item.is_running ? "#16a34a" : "#0f172a" }}>
                            {formatierteZeit(aktuelleZeit)}
                          </span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button onClick={() => toggleTimer(item)} style={{ padding: "4px 10px", borderRadius: "6px", border: "none", backgroundColor: item.is_running ? "#fef2f2" : "#f0fdf4", color: item.is_running ? "#dc2626" : "#16a34a", fontWeight: "600", fontSize: "12px", cursor: "pointer" }}>
                              {item.is_running ? "⏹" : "▶"}
                            </button>
                            <button onClick={() => setBearbeitenEintrag(item)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: "12px" }}>✏️</button>
                            <button onClick={() => eintragLoeschen(item.id)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {spaltenEintraege.length === 0 && (
                    <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", padding: "24px 12px", background: "#ffffff", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
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
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#ffffff", padding: "28px", borderRadius: "16px", width: "480px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Eintrag bearbeiten</h3>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <input 
                type="number"
                value={bearbeitenEintrag.ticket_nummer || ""} 
                onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, ticket_nummer: Number(e.target.value)})} 
                placeholder="Ticket Nr." 
                style={{ width: "110px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} 
              />
              <input 
                value={bearbeitenEintrag.prozess_name || ""} 
                onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, prozess_name: e.target.value})} 
                placeholder="Name"
                style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <textarea 
              value={bearbeitenEintrag.beschreibung || ""} 
              onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, beschreibung: e.target.value})} 
              placeholder="Beschreibung"
              style={{ width: "100%", height: "60px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />

            <textarea 
              value={bearbeitenEintrag.fortlaufende_notizen || ""} 
              onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, fortlaufende_notizen: e.target.value})} 
              placeholder="Notizen"
              style={{ width: "100%", height: "60px", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <select 
                value={bearbeitenEintrag.status || "offen"} 
                onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, status: e.target.value})}
                style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              >
                <option value="offen">Offen</option>
                <option value="in_bearbeitung">In Bearbeitung</option>
                <option value="abgeschlossen">Abgeschlossen</option>
              </select>

              <select 
                value={bearbeitenEintrag.prioritaet || "mittel"} 
                onChange={(e) => setBearbeitenEintrag({...bearbeitenEintrag, prioritaet: e.target.value})}
                style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              >
                <option value="niedrig">Niedrig</option>
                <option value="mittel">Mittel</option>
                <option value="hoch">Hoch</option>
                <option value="dringend">Dringend</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button 
                onClick={() => setBearbeitenEintrag(null)} 
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
              >
                Abbrechen
              </button>
              <button 
                onClick={eintragSpeichern} 
                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "600", cursor: "pointer" }}
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}