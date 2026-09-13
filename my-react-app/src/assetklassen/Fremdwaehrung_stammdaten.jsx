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

      {ansicht === 'card' ? (
        <div className="karten-grid">
          {listeFremdwaehrungskonto.map((e) => {
            const gefundenerEintrag = listeFremdwaehrungskonto.find(k => k.asset?.asset_id === e.elternkonto);
            const elternkontoName = gefundenerEintrag ? gefundenerEintrag.asset?.asset_name : null;

            const transaktionen = e.asset?.transaktionsprotokoll || [];
            const aktuellerKontostand = transaktionen.reduce((acc, t) => {
              const betrag = Number(t.betrag || 0);
              return t.typ === 'einnahme' ? acc + betrag : acc - betrag;
            }, 0);

            return (
              <div className="account-card" key={e.id}>
                <div className="card-header">
                  <div>
                    <h3>{e.asset?.asset_name}</h3>
                    <span className="bank-name">{e.name_der_bank}</span>
                  </div>
                  <div className="badge-group">
                    {e.hauptkonto && <span className="badge badge-primary">Hauptkonto</span>}
                    {e.ist_referenzkonto && <span className="badge badge-info">Referenzkonto</span>}
                    {e.ist_aktiv === false && <span className="badge badge-warning">Inaktiv</span>}
                  </div>
                </div>

                <div className="card-body">
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

                <div className="card-actions">
                  <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                  <button onClick={() => handleDelete(e.asset?.asset_id)} title="Löschen">🗑️</button>
                  <button onClick={() => transaktionenOeffnen(e.asset?.asset_id)} title="Transaktionen">💰</button>
                </div>
              </div>
            );
          })}
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
                  <tr className={e.ist_aktiv === false ? 'row-inactive' : ''}>
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
                      <button onClick={() => } title="Bearbeiten">✏️</button>
                      <button onClick={() => } title="Löschen">🗑️</button>
                      <button onClick={() => } title="Transaktionen">💰</button>
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