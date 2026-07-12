import { supabase } from "./supabase";
import { useEffect, useState } from "react";



export default function Konfiguration({ darkMode, setDarkMode }) {

  const [kategorien, setKategorien] = useState([])
  const [neueKategorie, setNeueKategorie] = useState("")
  const [kategorieInter, setkategorieInter] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        await ladeKategorien()
      } catch (err) {
        console.error("Fehler in init:", err)
      }
    }
    init()
  }, [])

  const ladeKategorien = async () => {
      const { data } = await supabase
        .from("transaktionskategorie")
        .select("*")
        .order("name", { ascending: true })
  
      if (data) setKategorien(data)
    }

    const kategorieHinzufuegen = async () => {
        if (!neueKategorie) return
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from("transaktionskategorie").insert({
          benutzer_id: user.id,
          name: neueKategorie,
          ist_vordefiniert: false,
          erstellt_am: new Date()
        })
        setNeueKategorie("")
        ladeKategorien()
      }

      const kategorieLoeschen = async (id, ist_vordefiniert) => {
          if (ist_vordefiniert === false) {
            await supabase.from("transaktionskategorie").delete().eq("id", id)
          }
          ladeKategorien()
        }

  return (
    <div>
    <button onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>

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

      </div>

  );
}
