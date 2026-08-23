import { useEffect, useState, useContext, use } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import { SettingsContext } from '../SettingsContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { data } from "react-router-dom";

export default function Fremdwaehrung_stammdaten() {

  const [listeWaehrung, setListeWaehrung] = useState([])


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
  const items = listeWaehrung;

  const filteredItems = items.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Suchen..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul>
        {filteredItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
