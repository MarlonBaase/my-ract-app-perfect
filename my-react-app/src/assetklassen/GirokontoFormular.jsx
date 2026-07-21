import { useState } from "react";

export default function GirokontoFormular({ initialDaten, elternkontoListe, onSpeichern, onAbbrechen }) {
    // States für die Formularfelder
    const [name, setName] = useState(initialDaten?.asset?.asset_name || "");
    const [bank, setBank] = useState(initialDaten?.name_der_bank || "");
    const [iban, setIban] = useState(initialDaten?.iban || "");
    const [einzahlung_bei_eroeffnung, setEinzahlung_bei_eroeffnung] = useState(initialDaten?.einzahlung_bei_eroeffnung || "");
    const [hauptkonto, setHauptkonto] = useState(initialDaten?.hauptkonto ?? true);
    const [ausgewaehltesElternkonto, setAusgewaehltesElternkonto] = useState(initialDaten?.elternkonto || "");

    const handleSubmit = (e) => {
        e.preventDefault();

        // Alle Werte in ein Objekt packen
        const formData = {
            name,
            bank,
            iban,
            einzahlung: parseFloat(einzahlung_bei_eroeffnung) || 0,
            hauptkonto,
            elternkonto: hauptkonto ? null : ausgewaehltesElternkonto // Falls Hauptkonto true ist, ist Elternkonto null
        };

        // An Eltern-Komponente übergeben
        onSpeichern(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Asset Name (z.B. Hauptkonto)" 
                required 
            />
            
            <input 
                value={bank} 
                onChange={(e) => setBank(e.target.value)} 
                placeholder="Bank Name (z.B. Sparkasse)" 
                required 
            />

            <input 
                value={iban} 
                onChange={(e) => setIban(e.target.value)} 
                placeholder="IBAN" 
            />

            <input 
                type="number"
                step="0.01"
                value={einzahlung_bei_eroeffnung} 
                onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} 
                placeholder="Einzahlung bei Eröffnung (€)" 
            />

            <div>
                <input 
                    type="checkbox" 
                    id="hauptkonto" 
                    checked={hauptkonto} 
                    onChange={(e) => setHauptkonto(e.target.checked)} 
                />
                <label htmlFor="hauptkonto"> Hauptkonto</label>
            </div>

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

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button type="submit">Speichern</button>
                <button type="button" onClick={onAbbrechen}>Abbrechen</button>
            </div>
        </form>
    );
}