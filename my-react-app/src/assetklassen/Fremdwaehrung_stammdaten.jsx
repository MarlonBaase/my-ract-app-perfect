import { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ladeWaehrungen, filterWaehrungen } from "../services/fremdwaehrung_stammdatenService";
import { fetchAktuellerTageskurs } from "../services/fremdwaehrung_detailService";
import { SettingsContext } from '../SettingsContext';

export default function FremdwaehrungStammdaten() {
  const [listeWaehrung, setListeWaehrung] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tageskurs, setTageskurs] = useState(null);

  const { ansicht } = useContext(SettingsContext);
  const { code } = useParams();
  const navigate = useNavigate();

  const ladeDaten = useCallback(async () => {
    if (!code) return;

    const aktueller = await fetchAktuellerTageskurs(code);

    setTageskurs(aktueller);
  }, [code]);

  useEffect(() => {
    ladeDaten();
  }, [ladeDaten]);

  useEffect(() => {
    const fetchWaehrungen = async () => {
      const data = await ladeWaehrungen();
      setListeWaehrung(data);
    };

    fetchWaehrungen();
  }, []);

  const filteredItems = filterWaehrungen(listeWaehrung, searchTerm);
  const kursAktuell = tageskurs?.tageskurs_zu_eur;

  return (
    <div>
      <input
        type="text"
        placeholder="Suchen..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {ansicht === 'card' ? (
        <div className="karten-grid">

          return (
          <div className="account-card">
            <div className="card-header">
              <div className="badge-group">
              </div>
            </div>

            <div className="card-body">
              <p>{kursAktuell ?? "Lade..."}</p>
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

            {/* <div className="card-actions">
                  <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                  <button onClick={() => handleDelete(e.asset?.asset_id)} title="Löschen">🗑️</button>
                  <button onClick={() => transaktionenOeffnen(e.asset?.asset_id)} title="Transaktionen">💰</button>
                </div> */}
          </div>
          );

        </div>
      ) : (
        <div className="table-responsive">
          <table className="konto-tabelle">
            <thead>
              <tr>
                <th>Asset / Bank</th>
                <th>IBAN / BIC</th>
                <th>Guthaben</th>
                <th>Konto-Details</th>
                <th>Inhaber</th>
                <th>Elternkonto</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>

              return (
              <tr>
                <td>

                </td>
                <td className="code-text">
                </td>
                <td>
                </td>
                <td className="subtext">
                </td>
                <td></td>
                <td></td>
                <td className="table-actions">
                  {/* <button onClick={() => } title="Bearbeiten">✏️</button>
                      <button onClick={() => } title="Löschen">🗑️</button>
                      <button onClick={() => } title="Transaktionen">💰</button> */}
                </td>
              </tr>
              );
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}