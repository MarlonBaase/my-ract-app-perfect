import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function Support() {
  const [abgesendet, setAbgesendet] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAbgesendet(true);
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

        <form onSubmit={handleSubmit} className="support-form">
          <div className="input-group">
            <label className="input-label">E-Mail-Adresse</label>
            <input 
              type="email" 
              required
              placeholder="name@beispiel.de" 
              className="login-input" 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Telefonnummer (optional)</label>
            <input 
              type="tel" 
              placeholder="+49 123 456789" 
              className="login-input" 
            />
          </div>

          <div className="input-group">
            <label className="input-label">Dein Anliegen / Problem</label>
            <textarea 
              required
              placeholder="Beschreibe kurz, wobei du Hilfe benötigst..." 
              className="login-input support-textarea"
            />
          </div>

          <button type="submit" className="login-button">
            Nachricht absenden
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