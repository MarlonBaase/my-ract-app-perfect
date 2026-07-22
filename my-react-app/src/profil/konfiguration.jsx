import { supabase } from "../supabase";
import { useEffect, useState, useContext } from "react";
import { SettingsContext } from "../SettingsContext";

export default function Konfiguration({ darkMode, setDarkMode }) {
  const [kategorien, setKategorien] = useState([]);
  const [neueKategorie, setNeueKategorie] = useState("");
  const [kategorieInter, setkategorieInter] = useState("");

  // 💡 Layout-State aus dem globalen Context holen
  const { ansicht, setAnsicht } = useContext(SettingsContext);

  useEffect(() => {
    const init = async () => {
      try {
        await ladeKategorien();
      } catch (err) {
        console.error("Fehler in init:", err);
      }
    };
    init();
  }, []);

  const ladeKategorien = async () => {
    const { data } = await supabase
      .from("transaktionskategorie")
      .select("*")
      .order("name", { ascending: true });

    if (data) setKategorien(data);
  };

  const kategorieHinzufuegen = async () => {
    if (!neueKategorie) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("transaktionskategorie").insert({
      benutzer_id: user.id,
      name: neueKategorie,
      ist_vordefiniert: false,
      erstellt_am: new Date()
    });
    setNeueKategorie("");
    ladeKategorien();
  };

  const kategorieLoeschen = async (id, ist_vordefiniert) => {
    if (ist_vordefiniert === false) {
      await supabase.from("transaktionskategorie").delete().eq("id", id);
    }
    ladeKategorien();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "https://my-ract-app-perfect.vercel.app/";
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
        <button onClick={kategorieHinzufuegen}>Kategorie hinzufügen</button>
      </div>

      <ul>
        {kategorien.map((e) => (
          <li key={e.id}>
            {e.name}
            {!e.ist_vordefiniert && (
              <button onClick={() => kategorieLoeschen(e.id, e.ist_vordefiniert)}>🗑️</button>
            )}
          </li>
        ))}
      </ul>

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