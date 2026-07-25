import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Zeiterfassung() {
  const [eintraege, setEintraege] = useState([]);
  const [ticketNummer, setTicketNummer] = useState("");
  const [prozessName, setProzessName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [aktiverTimerId, setAktiverTimerId] = useState(null);

  

  // Live-Timer Ticker für aktive Messung
  useEffect(() => {
    const interval = setInterval(() => {
      setEintraege((prev) =>
        prev.map((e) => {
          if (e.is_running && e.gestartet_am) {
            const diffSec = Math.floor((new Date() - new Date(e.gestartet_am)) / 1000);
            return { ...e, tempDauer: e.dauer_sekunden + diffSec };
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

    if (error) console.error("Fehler beim Laden:", error);
    else setEintraege(data || []);
  };

  const prozessErstellen = async (e) => {
    e.preventDefault();
    if (!ticketNummer || !prozessName) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("zeiterfassung").insert({
      benutzer_id: user.id,
      ticket_nummer: ticketNummer,
      prozess_name: prozessName,
      beschreibung: beschreibung,
      status: "offen"
    });

    if (!error) {
      setTicketNummer("");
      setProzessName("");
      setBeschreibung("");
      await naechsteNummer();
      ladeZeiterfassungen();
    }
  };

  const toggleTimer = async (eintrag) => {
    const jetzt = new Date().toISOString();

    if (eintrag.is_running) {
      // Timer stoppen
      const zusaetzlicheSekunden = Math.floor((new Date() - new Date(eintrag.gestartet_am)) / 1000);
      const neueGesamtdauer = (eintrag.dauer_sekunden || 0) + zusaetzlicheSekunden;

      await supabase
        .from("zeiterfassung")
        .update({
          is_running: false,
          dauer_sekunden: neueGesamtdauer,
          gestartet_am: null,
          status: "in_bearbeitung"
        })
        .eq("id", eintrag.id);

      setAktiverTimerId(null);
    } else {
      // Timer starten
      await supabase
        .from("zeiterfassung")
        .update({
          is_running: true,
          gestartet_am: jetzt,
          status: "in_bearbeitung"
        })
        .eq("id", eintrag.id);

      setAktiverTimerId(eintrag.id);
    }
    ladeZeiterfassungen();
  };

  const statusAendern = async (id, neuerStatus) => {
    await supabase.from("zeiterfassung").update({ status: neuerStatus }).eq("id", id);
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

  const naechsteNummer = async () => {

    const { data } = await supabase
      .from("zeiterfassung")
      .select("ticket_nummer")
      .order("erstellt_am", {ascending: false})
      .limit(1)
      .single

    if (data){
      setTicketNummer(data.ticket_nummer + 1)
    }
    else{
      setTicketNummer("0001")
    }
  }


  useEffect(() => {
    ladeZeiterfassungen();
    naechsteNummer();
  }, []);

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2>Zeiterfassung & Prozess-Tracking</h2>

      {/* --- NEUEN PROZESS ANLEGEN --- */}
      <form onSubmit={prozessErstellen} style={{ display: "grid", gap: "12px", marginBottom: "32px", background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            value={ticketNummer}
            onChange={(e) => setTicketNummer(e.target.value)}
            placeholder="Ticketnummer"
            style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            required
          />
          <input
            placeholder="Prozess / Aufgabe Name"
            value={prozessName}
            onChange={(e) => setProzessName(e.target.value)}
            style={{ flex: 2, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            required
          />
        </div>
        <textarea
          placeholder="To-Do Details & Notizen..."
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", minHeight: "60px" }}
        />
        <button type="submit" style={{ padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
          Prozess anlegen
        </button>
      </form>

      {/* --- TABELLE DER PROZESSE --- */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "12px" }}>Ticket</th>
              <th style={{ padding: "12px" }}>Prozess & To-Dos</th>
              <th style={{ padding: "12px" }}>Status</th>
              <th style={{ padding: "12px" }}>Zeit</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {eintraege.map((item) => {
              const aktuelleZeit = item.is_running ? item.tempDauer || item.dauer_sekunden : item.dauer_sekunden;

              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>{item.ticket_nummer}</td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ fontWeight: "600" }}>{item.prozess_name}</div>
                    <small style={{ color: "#64748b" }}>{item.beschreibung}</small>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <select
                      value={item.status}
                      onChange={(e) => statusAendern(item.id, e.target.value)}
                      style={{ padding: "4px 8px", borderRadius: "4px" }}
                    >
                      <option value="offen">Offen</option>
                      <option value="in_bearbeitung">In Bearbeitung</option>
                      <option value="abgeschlossen">Abgeschlossen</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "16px", fontWeight: "bold" }}>
                    {formatierteZeit(aktuelleZeit)}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button
                      onClick={() => toggleTimer(item)}
                      style={{
                        padding: "6px 12px",
                        marginRight: "8px",
                        borderRadius: "4px",
                        border: "none",
                        color: "white",
                        backgroundColor: item.is_running ? "#ef4444" : "#10b981",
                        cursor: "pointer"
                      }}
                    >
                      {item.is_running ? "Stop ⏹" : "Start ▶"}
                    </button>
                    <button
                      onClick={() => eintragLoeschen(item.id)}
                      style={{ border: "none", background: "none", cursor: "pointer" }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}