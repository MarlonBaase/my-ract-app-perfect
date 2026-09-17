import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ladeWaehrungen, filterWaehrungen, ladeTageskurse, filterTageskurse, filterFavourites, favouritesSetzen } from "../services/fremdwaehrung_stammdatenService";
import { SettingsContext } from '../SettingsContext';

export default function FremdwaehrungStammdaten() {
  const [listeWaehrung, setListeWaehrung] = useState([]);
  const [listeTageskurse, setListeTageskurse] = useState([]);
  const [listeFavourites, setListeFavourites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [favourites, setFavourites] = useState("");

  const { ansicht } = useContext(SettingsContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWaehrungen = async () => {
      const data = await ladeWaehrungen();
      setListeWaehrung(data);
    };

    const fetchTageskurse = async () => {
      const data = await ladeTageskurse();
      setListeTageskurse(data);
    }

    const fetchFavourites = async () => {
      const data = await favouritesSetzen();
      setListeFavourites(data);
    }


    fetchWaehrungen();
    fetchTageskurse();
    fetchFavourites();
  }, []);

  const filteredItems = filterWaehrungen(listeWaehrung, searchTerm);
  const filteredKurs = filterTageskurse(listeTageskurse, searchTerm);
  const filteredFavourites = filterFavourites(listeFavourites);
  

  console.log(filteredItems)

  return (
    <div>
      <input
        type="text"
        placeholder="Suchen..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {ansicht === 'card' ? (
        <div>
          {filteredItems.map((waehrung) => (
            <div className="karten-grid" key={waehrung.waehrungs_code}>
              <li style={{ listStyle: "none" }}>
                <div className="account-card">
                  <div className="card-header"></div>
                  <div className="badge-group"></div>
                  <div className="card-body">
                    {filteredKurs
                      .filter((k) => k.waehrungs_code === waehrung.waehrungs_code)
                      .map((kurs, index) => (
                        <div key={index}>
                          <p>{kurs.tageskurs_zu_eur}</p>
                        </div>
                      ))}
                      {waehrung.name} ({waehrung.symbol}) - {waehrung.waehrungs_code}
                      <div className="card-actions">
                        <button onClick={() => navigate(`/assetklassen/lf/fremdwaehrung/fremdwaehrung_stammdaten/${waehrung.waehrungs_code}`)}>
                          ✏️ Details
                        </button>
                        <button onClick={() => setFavourites}>
                          Favourit
                        </button>
                        {filteredFavourites
                          .map((waehrungs_code, index) => (
                            <div key={index}>
                              <p>{waehrungs_code.waehrungs_code}</p>
                            </div>
                          ))}
                      </div>
                    
                    {/*<div className="card-actions">
                  <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                  <button onClick={() => handleDelete(e.asset?.asset_id)} title="Löschen">🗑️</button>
                  <button onClick={() => transaktionenOeffnen(e.asset?.asset_id)} title="Transaktionen">💰</button>
                </div>
                */}
                  </div>
                </div>
              </li>
            </div>
          ))}
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
      )
      }
    </div >
  );
}