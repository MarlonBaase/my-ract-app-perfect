import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import 'react-toastify/dist/ReactToastify.css';

export default function Fremdwaehrung_stammdaten() {

  const [listeWaehrung, setListeWaehrung] = useState([])
  const navigate = useNavigate();


  const ladeWaehrungen = async () => {
    const { data, error } = await supabase
      .from("waehrungsstammdaten")
      .select(`waehrungs_code, name, symbol`);

    if (handleApiError(error, "Waehrung laden")) return;
    if (data) setListeWaehrung(data)
  }


  useEffect(() => {
    const init = async () => {
      try {
        await ladeWaehrungen()
      } catch (err) {
        console.error("Fehler in init:", err);
      }
    };
    init();
  }, []);

  console.log(listeWaehrung)

  const [searchTerm, setSearchTerm] = useState('');

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
          <button onClick={() => navigate(`/assetklassen/lf/fremdwaehrung/fremdwaehrung_stammdaten/${item.waehrungs_code}`)}>
            ✏️ {item.name} ({item.symbol}) - {item.waehrungs_code}
          </button>
        ))}
      </ul>
    </div>
  );
}
