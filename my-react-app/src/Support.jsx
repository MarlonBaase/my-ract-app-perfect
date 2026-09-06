import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from "./supabase";

export default function Support() {
  const [activeTab, setActiveTab] = useState('neues-ticket'); // 'neues-ticket' | 'meine-tickets'
  
  // Formular-States
  const [titel, setTitel] = useState('');
  const [kategorie, setKategorie] = useState('allgemein');
  const [nachricht, setNachricht] = useState('');
  
  // Tickets & Chat States
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [userAntwort, setUserAntwort] = useState('');
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [abgesendet, setAbgesendet] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Eigene Tickets aus Supabase laden
  const loadUserTickets = async () => {
    setTicketsLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) return;

      const user = userData.user;

      // Tickets inklusive zugehöriger Nachrichten abrufen
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, support_nachrichten(*)')
        .order('erstellt_am', { ascending: false });

      if (error) throw error;

      setTickets(data || []);

      // Falls bereits ein Ticket ausgewählt war, dieses im State aktualisieren
      if (selectedTicket) {
        const updated = data.find((t) => t.id === selectedTicket.id);
        setSelectedTicket(updated || null);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Tickets:', err.message);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'meine-tickets') {
      loadUserTickets();
    }
  }, [activeTab]);

  // 2. Neues Ticket erstellen
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error('Du musst eingeloggt sein, um eine Support-Anfrage zu senden.');
      }
      const user = userData.user;

      // 1. Eintrag in 'support_tickets' erstellen
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert([
          {
            benutzer_id: user.id, // Falls deine Spalte in Supabase 'benutzer_id' heißt
            titel: titel,
            kategorie: kategorie,
            status: 'offen',
            prioritaet: 'mittel'
          }
        ])
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Erste Nachricht in 'support_nachrichten' speichern
      const { error: msgError } = await supabase
        .from('support_nachrichten')
        .insert([
          {
            ticket_id: ticket.id,
            sender_id: user.id,
            nachricht: nachricht,
            ist_admin: false
          }
        ]);

      if (msgError) throw msgError;

      setTitel('');
      setKategorie('allgemein');
      setNachricht('');
      setAbgesendet(true);

    } catch (err) {
      setErrorMsg(err.message || 'Beim Senden der Nachricht ist ein Fehler aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Auf ein bestehendes Ticket antworten (User-Antwort)
  const handleSendUserAntwort = async (e) => {
    e.preventDefault();
    if (!userAntwort.trim() || !selectedTicket) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { error } = await supabase
        .from('support_nachrichten')
        .insert([
          {
            ticket_id: selectedTicket.id,
            sender_id: user.id,
            nachricht: userAntwort,
            ist_admin: false
          }
        ]);

      if (error) throw error;

      setUserAntwort('');
      loadUserTickets(); // Chat direkt neu laden
    } catch (err) {
      alert('Fehler beim Senden der Antwort: ' + err.message);
    }
  };

  // Sortierung der Nachrichten für den Chatverlauf
  const sortedMessages = selectedTicket?.support_nachrichten
    ? [...selectedTicket.support_nachrichten].sort(
        (a, b) => new Date(a.erstellt_am) - new Date(b.erstellt_am)
      )
    : [];

  return (
    <div className="support-container">
      <div className="support-card" style={{ maxWidth: activeTab === 'meine-tickets' ? '800px' : '600px', transition: 'all 0.3s ease' }}>
        <div className="support-header">
          <div className="support-icon">🎧</div>
          <h2 className="support-title">Hilfe & Support</h2>
          <p className="support-subtitle">
            Hast du eine Frage oder ein Problem? Erstelle ein Ticket oder verfolge deine bestehenden Anfragen.
          </p>

          {/* Navigation / Tabs */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('neues-ticket')}
              className="login-button"
              style={{
                backgroundColor: activeTab === 'neues-ticket' ? undefined : '#2a2a2a',
                opacity: activeTab === 'neues-ticket' ? 1 : 0.7,
                padding: '8px 16px',
                fontSize: '0.9em'
              }}
            >
              Neues Ticket
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('meine-tickets')}
              className="login-button"
              style={{
                backgroundColor: activeTab === 'meine-tickets' ? undefined : '#2a2a2a',
                opacity: activeTab === 'meine-tickets' ? 1 : 0.7,
                padding: '8px 16px',
                fontSize: '0.9em'
              }}
            >
              Meine Tickets & Chat
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{ color: '#ff4d4d', marginBottom: '15px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        {/* TAB 1: FORMULAR NEUES TICKET */}
        {activeTab === 'neues-ticket' && (
          <form onSubmit={handleSubmit} className="support-form">
            <div className="input-group">
              <label className="input-label">Betreff / Titel*</label>
              <input 
                type="text" 
                required
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                placeholder="Kurze Zusammenfassung deines Anliegens" 
                className="login-input" 
              />
            </div>

            <div className="input-group">
              <label className="input-label">Kategorie</label>
              <select 
                value={kategorie}
                onChange={(e) => setKategorie(e.target.value)}
                className="login-input"
              >
                <option value="allgemein">Allgemein</option>
                <option value="fehler">Fehler / Bug</option>
                <option value="frage">Frage zur Bedienung</option>
                <option value="feature">Feature-Wunsch</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Dein Anliegen / Problem*</label>
              <textarea 
                required
                value={nachricht}
                onChange={(e) => setNachricht(e.target.value)}
                placeholder="Beschreibe kurz, wobei du Hilfe benötigst..." 
                className="login-input support-textarea"
              />
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Wird gesendet...' : 'Nachricht absenden'}
            </button>
          </form>
        )}

        {/* TAB 2: MEINE TICKETS & CHAT */}
        {activeTab === 'meine-tickets' && (
          <div style={{ marginTop: '20px' }}>
            {ticketsLoading ? (
              <p style={{ textAlign: 'center', color: '#aaa' }}>Tickets werden geladen...</p>
            ) : tickets.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa' }}>Du hast noch keine Support-Tickets erstellt.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.5fr' : '1fr', gap: '15px' }}>
                {/* Liste der Tickets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #333',
                        backgroundColor: selectedTicket?.id === t.id ? '#2a2a2a' : '#1a1a1a',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>{t.titel}</div>
                      <div style={{ fontSize: '0.8em', color: '#aaa', marginTop: '4px' }}>
                        Status: <strong style={{ color: t.status === 'offen' ? '#eab308' : t.status === 'in_bearbeitung' ? '#3b82f6' : '#22c55e' }}>{t.status}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detail & Chatverlauf */}
                {selectedTicket && (
                  <div style={{ border: '1px solid #333', borderRadius: '6px', padding: '12px', backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>{selectedTicket.titel}</h4>
                      
                      {/* Chat-Verlauf */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '15px' }}>
                        {sortedMessages.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              alignSelf: m.ist_admin ? 'flex-start' : 'flex-end',
                              backgroundColor: m.ist_admin ? '#1e3a8a' : '#374151',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              maxWidth: '85%',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ fontSize: '0.7em', opacity: 0.7, marginBottom: '2px' }}>
                              {m.ist_admin ? 'Support Team' : 'Du'} • {new Date(m.erstellt_am).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ fontSize: '0.9em', color: '#fff' }}>{m.nachricht}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Antwort-Eingabe */}
                    {selectedTicket.status !== 'geschlossen' ? (
                      <form onSubmit={handleSendUserAntwort} style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={userAntwort}
                          onChange={(e) => setUserAntwort(e.target.value)}
                          placeholder="Antworten..."
                          className="login-input"
                          style={{ flex: 1, padding: '8px' }}
                          required
                        />
                        <button type="submit" className="login-button" style={{ padding: '8px 12px', width: 'auto' }}>
                          Senden
                        </button>
                      </form>
                    ) : (
                      <p style={{ fontSize: '0.85em', color: '#888', margin: 0 }}>Dieses Ticket ist geschlossen.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Erfolgs-Modal per React Portal */}
      {abgesendet && createPortal(
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon">🎉</div>
            <h3 className="login-title">Vielen Dank!</h3>
            <p className="login-subtitle" style={{ marginBottom: '20px' }}>
              Deine Nachricht wurde erfolgreich übermittelt. Wir kümmern uns umgehend darum!
            </p>
            <button 
              onClick={() => {
                setAbgesendet(false);
                setActiveTab('meine-tickets');
              }} 
              className="login-button"
            >
              Zu meinen Tickets
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}