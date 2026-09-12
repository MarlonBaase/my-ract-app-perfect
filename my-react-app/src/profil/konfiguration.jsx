import { useState, useEffect, useContext } from 'react';
import {
  ladeKategorien,
  kategorieHinzufuegen,
  kategorieLoeschen,
  logout,
  startSetup2FA,
  enableMfa,
  disableMfa
} from '../services/konfigurationService';
import { SettingsContext } from "../SettingsContext";


export default function Konfiguration({ darkMode, setDarkMode }) {
  const [kategorien, setKategorien] = useState([]);
  const [neueKategorie, setNeueKategorie] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [factorId, setFactorID] = useState("");
  const { ansicht, setAnsicht } = useContext(SettingsContext);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');


  const fetchKategorien = async () => {
    try {
      const data = await ladeKategorien();
      setKategorien(data || []);
    } catch (err) {
      console.error("Fehler beim Laden der Kategorien:", err);
    }
  };


  useEffect(() => {
    const init = async () => {
      try {
        await fetchKategorien();
      } catch (err) {
        console.error("Fehler in init:", err);
      }
    };
    init();
  }, []);


  const handleAddKategorie = async (e) => {
    e.preventDefault();
    if (!neueKategorie.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      await kategorieHinzufuegen(neueKategorie);
      setNeueKategorie("");
      await fetchKategorien();
    } catch (err) {
      console.error("Fehler beim Hinzufügen der Kategorie:", err);
      setErrorMsg('Fehler beim Hinzufügen der Kategorie');
    } finally {
      setLoading(false);
    }
  };

  // Handler zum Löschen von Kategorien
  const handleDeleteKategorie = async (id, ist_vordefiniert) => {
    try {
      await kategorieLoeschen(id, ist_vordefiniert);
      await fetchKategorien();
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
    }
  };
  

  const handleStartSetup = async () => {
    try {
      const res = await startSetup2FA();
      if (res) {
        setQrCodeUrl(res.qrCodeUrl);
        setFactorID(res.factorId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // 4. MFA Verifizierung übergibt Werte an den Service
  const handleEnableMfa = async () => {
    try {
      await enableMfa({ factorId, confirmCode });
      alert("2FA wurde erfolgreich aktiviert!");
      setQrCodeUrl("");
      setConfirmCode("");
    } catch (err) {
      alert(`Fehler beim Aktivieren: ${err.message}`);
    }
  };

  const handleDisableMfa = async () => {
    try {
      await disableMfa();
      alert("2FA wurde erfolgreich deaktiviert!");
    } catch (err) {
      alert(`Fehler beim Deaktivieren: ${err.message}`);
    }
  };


  return (
    <div>
      <button onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>

      {/* 💡 Neues Auswahlfeld für die Layout-Ansicht */}
      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <h4>Standard-Ansicht für Konten</h4>
        <select
          value={ansicht}
          onChange={(e) => setAnsicht(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px" }}
        >
          <option value="card">🎴 Kartenansicht</option>
          <option value="table">📊 Tabellenansicht</option>
        </select>
      </div>

      <div>
        <h4>Eigene Kategorie hinzufügen</h4>
        <input
          value={neueKategorie}
          onChange={(e) => setNeueKategorie(e.target.value)}
          placeholder="z.B. 🎮 Gaming"
        />
        <button onClick={handleAddKategorie} disabled={loading}>
          {loading ? "Wird hinzugefügt..." : "Kategorie hinzufügen"}
        </button>
        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      </div>

      <ul>
        {kategorien.map((e) => (
          <li key={e.id}>
            {e.name}
            {!e.ist_vordefiniert && (
              <button onClick={() => handleDeleteKategorie(e.id, e.ist_vordefiniert)}>🗑️</button>
            )}
          </li>
        ))}
      </ul>

      <div>
        <button onClick={handleStartSetup}>2-FA aktivieren</button>
        <button onClick={handleDisableMfa}>2-FA deaktivieren</button>
        {qrCodeUrl === "" ?
          (<div>
            <h2>nicht vorhanden</h2>
          </div>) :
          (<div>
            <h2>2-FA QR-Code</h2>
            <img src={qrCodeUrl} alt="2FA QR Code" />
            <input value={confirmCode} type="text" placeholder="code" onChange={(e) => setConfirmCode(e.target.value)}></input>
            <button onClick={handleEnableMfa}>Verifizieren & Aktivieren</button>
          </div>)}
      </div>

      <div>
        <h1>Profil</h1>
        <div>
          <button onClick={logout}>Logout</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingLeft: "50px", paddingTop: "50px" }}>
        </div>
      </div>
    </div>
  );
}