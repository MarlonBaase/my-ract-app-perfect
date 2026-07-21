import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import GirokontoFormular from "./GirokontoFormular";

export default function Girokonto() {
  const [modalDaten, setModalDaten] = useState(null);
  const [listeGirokonto, setListeGirokonto] = useState([]);
  const [elternkontoListe, setElternkontoListe] = useState([]);

  // States für Transaktionen (bleiben erst einmal hier)
  const [modalOffenTransaktionen, setModalOffenTransaktionen] = useState(false);
  const [listeTransaktionenGirokonto, setListeTransaktionenGirokonto] = useState([]);

  // Daten von Supabase laden
  const ladeGirokonto = async () => {
    const { data, error } = await supabase
      .from("girokonto")
      .select("*, asset(asset_name, asset_id)");

    if (handleApiError(error, "Girokonten laden")) return;
    setListeGirokonto(data || []);
  };

  useEffect(() => {
    ladeGirokonto();
  }, []);

  const handleSpeichern = async (formData) => {
    if (modalDaten?.girokonto_id || modalDaten?.id) {
      // 1. UPDATE
      const { error: assetError } = await supabase
        .from("asset")
        .update({ asset_name: formData.name })
        .eq("asset_id", modalDaten.asset_id);

      if (handleApiError(assetError, "Asset Name updaten")) return;

      const { error: giroError } = await supabase
        .from("girokonto")
        .update({
          name_der_bank: formData.bank,
          iban: formData.iban,
          einzahlung_bei_eroeffnung: formData.einzahlung,
          hauptkonto: formData.hauptkonto,
          bic: formData.bic,
          zinssatz: formData.zinssatz,
          // hier alle weiteren Felder ergänzen
        })
        .eq("asset_id", modalDaten.asset_id);

      if (handleApiError(giroError, "Girokontodaten updaten")) return;
    } else {
      // 2. INSERT
      const { data: { user } } = await supabase.auth.getUser();

      const { data: assetData, error: assetError } = await supabase
        .from("asset")
        .insert({
          benutzer_id: user.id,
          asset_name: formData.name,
          asset_typ: "girokonto",
        })
        .select();

      if (handleApiError(assetError, "Asset anlegen")) return;

      const asset_id = assetData[0].asset_id;

      const { error: giroError } = await supabase
        .from("girokonto")
        .insert({
          asset_id: asset_id,
          name_der_bank: formData.bank,
          iban: formData.iban,
          einzahlung_bei_eroeffnung: formData.einzahlung,
          hauptkonto: formData.hauptkonto,
          bic: formData.bic,
          zinssatz: formData.zinssatz,
          // hier alle weiteren Felder ergänzen
        });

      if (handleApiError(giroError, "Girokonto anlegen")) return;
    }

    setModalDaten(null);
    ladeGirokonto();
  };

  return (
    <div>
      <h2>Girokonto</h2>

      <ul>
        {listeGirokonto.map((e) => (
          <li key={e.girokonto_id || e.id}>
            {e.asset?.asset_name} | {e.name_der_bank} | {e.iban}
            <button onClick={() => setModalDaten(e)}>✏️</button>
          </li>
        ))}
      </ul>

      <button onClick={() => setModalDaten({})}>Girokonto hinzufügen</button>

      {modalDaten && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", minWidth: "320px" }}>
            <GirokontoFormular
              initialDaten={(modalDaten.girokonto_id || modalDaten.id) ? modalDaten : null}
              elternkontoListe={elternkontoListe}
              onSpeichern={handleSpeichern}
              onAbbrechen={() => setModalDaten(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}