import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. useNavigate importieren
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import 'react-toastify/dist/ReactToastify.css';

export default function Fremdwaehrung_stammdaten() {
  const [listeWaehrung, setListeWaehrung] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate(); // 2. Hook aufrufen

  const ladeWaehrungen = async () => {
    const { data, error } = await supabase
      .from("waehrungsstammdaten")
      .select(`waehrungs_code, name, symbol`);

    if (handleApiError(error, "Waehrung laden")) return;
    if (data) setListeWaehrung(data);
  };

  useEffect(() => {
    ladeWaehrungen();
  }, []);

  const filteredItems = searchTerm.trim() === ''
    ? []
    : listeWaehrung.filter(item => {
        const name = String(item.name || '').toLowerCase();
        const code = String(item.waehrungs_code || '').toLowerCase();
        const search = searchTerm.toLowerCase();

        return name.includes(search) || code.includes(search);
      });

  return (
    <div>
      <input
        type="text"
        placeholder="Suchen..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul>
        {filteredItems.map((item) => (
          // 3. Eindeutigen key hinzufügen und Arrow-Function im onClick nutzen
          <li key={item.waehrungs_code} style={{ listStyle: "none" }}>
            <button 
              onClick={() => navigate(`/assetklassen/lf/fremdwaehrung/fremdwaehrung_stammdaten/${item.waehrungs_code}`)}
            >
              ✏️ {item.name} ({item.symbol}) - {item.waehrungs_code}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}