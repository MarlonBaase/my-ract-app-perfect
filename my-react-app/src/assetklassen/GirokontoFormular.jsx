import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";

export default function GirokontoFormular({ initialDaten, elternkontoListe, onSpeichern, onAbbrechen }) {

    const [name, setName] = useState(initialDaten?.asset?.asset_name || "");
    const [bank, setBank] = useState(initialDaten?.name_der_bank || "");
    const [iban, setIban] = useState(initialDaten?.iban || "");
    const [einzahlung_bei_eroeffnung, setEinzahlung_bei_eroeffnung] = useState(initialDaten?.einzahlung_bei_eroeffnung || "");
    const [hauptkonto, setHauptkonto] = useState(initialDaten?.hauptkonto ?? true);
    const [ausgewaehltesElternkonto, setAusgewaehltesElternkonto] = useState(initialDaten?.ausgewaehltesElternkonto || "");





    const handleSubmit = (e) => {
        e.preventDefault();

        
        const formData = {
            name,
            bank,
            iban,
            einzahlung: parseFloat(einzahlung_bei_eroeffnung) || 0,
            hauptkonto,
            // ... hier kommen die restlichen Formularwerte hin
        };

        
        onSpeichern(formData);
    };

    return(
        <form onSubmit={handleSubmit}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset Name (z.B. Hauptkonto)" />
            <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank Name (z.B. Sparkasse)" />
            <label htmlFor="hauptkonto">Hauptkonto</label>
                        <input type="checkbox" id="hauptkonto" checked={hauptkonto} onChange={(e) => setHauptkonto(e.target.checked)} />
                        {!hauptkonto && (
                            <select
                                value={ausgewaehltesElternkonto}
                                onChange={(e) => setAusgewaehltesElternkonto(e.target.value)}
                            >
                                <option value="">Elternkonto wählen (Optional)</option>
                                {elternkontoListe.map((a) => (
                                    <option key={a.asset_id} value={a.asset_id}>
                                        {a.name_der_bank} | {a.iban}
                                    </option>
                                ))}
                            </select>
                        )}

            <button type="submit">Speichern</button>
            <button onClick={onAbbrechen} type="button">Abbrechen</button>
        </form>
    )



    /*const [kontoinhaber, setKontoinhaber] = useState("")
    const [istAktiv, setIstAktiv] = useState("")

    const [elternkonto, setElternkonto] = useState("")
    const [elternkontoListe, setElternkontoListe] = useState([]); // Das Array für die Optionen
    
    const [dispoLimit, setDispoLimit] = useState("")
    const [bic, setBic] = useState("")
    const [zinssatz, setZinssatz] = useState("")

    const [waehrung, setWaehrung] = useState("")
    const [eroeffnungsdatum, setEroeffnungsdatum] = useState("")
    const [eintraege, setEintraege] = useState([])
    */





}