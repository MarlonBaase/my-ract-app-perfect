import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ladeWaehrungen, filterWaehrungen } from "../services/fremdwaehrung_stammdatenService";

export default function FremdwaehrungStammdaten() {
  const [listeWaehrung, setListeWaehrung] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchWaehrungen = async () => {
      const data = await ladeWaehrungen();
      setListeWaehrung(data);
    };

    fetchWaehrungen();
  }, []);

  const filteredItems = filterWaehrungen(listeWaehrung, searchTerm);

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
          <li key={item.waehrungs_code} style={{ listStyle: "none" }}>
            <button
              onClick={() =>
                navigate(`/assetklassen/lf/fremdwaehrung/fremdwaehrung_stammdaten/${item.waehrungs_code}`)
              }
            >
              ✏️ {item.name} ({item.symbol}) - {item.waehrungs_code}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}