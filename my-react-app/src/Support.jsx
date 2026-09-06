import { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from "./supabase";

export default function Support() {
  const [titel, setTitel] = useState('');
  const [kategorie, setKategorie] = useState('allgemein');
  const [nachricht, setNachricht] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [abgesendet, setAbgesendet] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Authentifizierten Nutzer abrufen
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error('Du musst eingeloggt sein, um eine Support-Anfrage zu senden.');
      }
      const user = userData.user;

      // 2. Eintrag in 'support_tickets' erstellen
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert([
          {
            benutzer_id: user.id,
            titel: titel,
            kategorie: kategorie,
            status: 'offen',
            prioritaet: 'mittel'
          }
        ])
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 3. Erste Nachricht in 'support_nachrichten' speichern
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

      // Felder zurücksetzen & Modal anzeigen
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

  return (
    <div className="support-container">
      <div className="support-card">
        <div className="support-header">
          <div className="support-icon">🎧</div>
          <h2 className="support-title">Hilfe & Support</h2>
          <p className="support-subtitle">
            Hast du eine Frage oder ein Problem? Sende uns eine Nachricht und wir melden uns schnellstmöglich.
          </p>
        </div>

        {errorMsg && (
          <div style={{ color: '#ff4d4d', marginBottom: '15px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

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
              onClick={() => setAbgesendet(false)} 
              className="login-button"
            >
              Schließen
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}