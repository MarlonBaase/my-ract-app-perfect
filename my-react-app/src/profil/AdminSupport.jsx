import React, { useState, useEffect } from 'react';
import { supabase } from "../supabase"; 

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('offen');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Tickets aus Supabase laden
  const loadAdminTickets = async () => {
    setLoading(true);
    setErrorMsg('');

    let query = supabase
      .from('support_tickets')
      .select('*, support_nachrichten(*)')
      .order('erstellt_am', { ascending: false });

    if (statusFilter !== 'alle') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMsg(error.message);
    } else {
      setTickets(data || []);
      // Aktualisiertes selektiertes Ticket im State behalten
      if (selectedTicket) {
        const updated = data.find((t) => t.id === selectedTicket.id);
        setSelectedTicket(updated || null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAdminTickets();
  }, [statusFilter]);

  // 2. Status des Tickets aktualisieren
  const handleStatusChange = async (ticketId, newStatus) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    if (error) {
      alert('Fehler beim Ändern des Status: ' + error.message);
    } else {
      loadAdminTickets();
    }
  };

  // 3. Als Admin auf Nachricht antworten
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const { data: userData } = await supabase.auth.getUser();
    const adminUser = userData?.user;

    if (!adminUser) {
      alert('Nicht als Admin eingeloggt!');
      return;
    }

    const { error } = await supabase.from('support_nachrichten').insert([
      {
        ticket_id: selectedTicket.id,
        sender_id: adminUser.id,
        nachricht: replyText,
        ist_admin: true,
      },
    ]);

    if (error) {
      alert('Fehler beim Senden: ' + error.message);
    } else {
      setReplyText('');
      // Status automatisch auf 'in_bearbeitung' setzen, falls er 'offen' war
      if (selectedTicket.status === 'offen') {
        await handleStatusChange(selectedTicket.id, 'in_bearbeitung');
      } else {
        loadAdminTickets();
      }
    }
  };

  // Nachrichten innerhalb des ausgewählten Tickets chronologisch sortieren
  const sortedMessages = selectedTicket?.support_nachrichten
    ? [...selectedTicket.support_nachrichten].sort(
        (a, b) => new Date(a.erstellt_am) - new Date(b.erstellt_am)
      )
    : [];

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#121212', minHeight: '100vh' }}>
      <h2>Support-Tickets Dashboard (Admin)</h2>

      {/* Filter-Leiste */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>Filter Status: </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '6px', background: '#222', color: '#fff', border: '1px solid #444' }}
        >
          <option value="alle">Alle Tickets</option>
          <option value="offen">Offen</option>
          <option value="in_bearbeitung">In Bearbeitung</option>
          <option value="geschlossen">Geschlossen</option>
        </select>
        <button onClick={loadAdminTickets} style={{ padding: '6px 12px', cursor: 'pointer' }}>
          Aktualisieren
        </button>
      </div>

      {errorMsg && <p style={{ color: '#ff4d4d' }}>Fehler: {errorMsg}</p>}

      {/* Haupt-Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Linke Spalte: Ticket Liste */}
        <div style={{ border: '1px solid #333', padding: '10px', maxHeight: '600px', overflowY: 'auto' }}>
          {loading ? (
            <p>Tickets werden geladen...</p>
          ) : tickets.length === 0 ? (
            <p>Keine Tickets gefunden.</p>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: t.id === selectedTicket?.id ? '#2a2a2a' : '#1e1e1e',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{t.titel}</div>
                <div style={{ fontSize: '0.85em', color: '#aaa', marginTop: '4px' }}>
                  Kat: {t.kategorie} | Status: <strong>{t.status}</strong>
                </div>
                <div style={{ fontSize: '0.75em', color: '#666', marginTop: '4px' }}>
                  User: {t.user_id.substring(0, 8)}...
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rechte Spalte: Detail & Nachrichten */}
        <div style={{ border: '1px solid #333', padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '4px' }}>
          {selectedTicket ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedTicket.titel}</h3>
                  <span style={{ fontSize: '0.8em', color: '#888' }}>User-ID: {selectedTicket.user_id}</span>
                </div>
                <div>
                  <label style={{ marginRight: '8px' }}>Status:</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    style={{ padding: '4px', background: '#222', color: '#fff', border: '1px solid #444' }}
                  >
                    <option value="offen">offen</option>
                    <option value="in_bearbeitung">in_bearbeitung</option>
                    <option value="geschlossen">geschlossen</option>
                  </select>
                </div>
              </div>

              {/* Chat-Verlauf */}
              <div style={{ margin: '20px 0', maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sortedMessages.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      alignSelf: n.ist_admin ? 'flex-end' : 'flex-start',
                      backgroundColor: n.ist_admin ? '#1e3a8a' : '#374151',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      maxWidth: '80%',
                    }}
                  >
                    <div style={{ fontSize: '0.75em', opacity: 0.8, marginBottom: '4px' }}>
                      {n.ist_admin ? 'Admin (Du)' : 'Kunde'} • {new Date(n.erstellt_am).toLocaleString('de-DE')}
                    </div>
                    <div>{n.nachricht}</div>
                  </div>
                ))}
              </div>

              {/* Antwort-Formular */}
              <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Als Admin antworten..."
                  style={{ flex: 1, padding: '8px', background: '#222', color: '#fff', border: '1px solid #444' }}
                  required
                />
                <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>
                  Antworten
                </button>
              </form>
            </div>
          ) : (
            <p style={{ color: '#888' }}>Wähle ein Ticket aus der Liste links aus, um es zu bearbeiten.</p>
          )}
        </div>
      </div>
    </div>
  );
}