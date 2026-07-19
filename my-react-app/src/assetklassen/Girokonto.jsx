import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Girokonto() {
    const [listeGirokonto, setListeGirokonto] = useState([])
    const [name, setName] = useState("")
    const [bank, setBank] = useState("")
    const [iban, setIban] = useState("")
    const [einzahlung_bei_eroeffnung, setEinzahlung_bei_eroeffnung] = useState("")
    const [waehrung, setWaehrung] = useState("")
    const [eroeffnungsdatum, setEroeffnungsdatum] = useState("")
    const [modalOffen, setModalOffen] = useState(false)
    const [modalOffenHinzu, setModalOffenHinzu] = useState(false)
    const [zuBearbeiten, setZuBearbeiten] = useState(null)
    const [eintraege, setEintraege] = useState([])

    const ladeGirokonto = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
            .from("girokonto")
            .select(`*, 
                asset!inner(
                    benutzer_id,
                    asset_name
                )
            `)
            .eq("asset.benutzer_id", user.id)
            .order("asset.asset_name", { ascending: true }) // Sortierung angepasst auf asset_name, falls name_der_bank nicht indiziert ist

        if (error) {
            console.error("Fehler beim Laden:", error.message)
            return
        }
        if (data) setListeGirokonto(data)
    }

    useEffect(() => {
        ladeGirokonto()
    }, [])

    const girokontoHinzufuegen = async () => {
        // Validierung: Prüfen, ob alle Pflichtfelder ausgefüllt sind
        if (!name || !bank || !iban || !einzahlung_bei_eroeffnung || !waehrung || !eroeffnungsdatum) return

        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Asset eintragen
            const { data: assetData, error: assetError } = await supabase
                .from("asset")
                .insert({
                    benutzer_id: user.id,
                    asset_name: name,
                    asset_typ: "girokonto",
                })
                .select()

            if (assetError || !assetData || assetData.length === 0) {
                console.error("Fehler beim Erstellen des Assets:", assetError.message || JSON.stringify(assetError))
                alert("Fehler beim Erstellen des übergeordneten Assets.")
                return
            }

            const asset_id = assetData[0].asset_id

            const { error: giroError } = await supabase
                .from("girokonto")
                .insert({
                    asset_id: asset_id,
                    name_der_bank: bank,
                    iban: iban,
                    einzahlung_bei_eroeffnung: parseFloat(einzahlung_bei_eroeffnung) || 0,
                    waehrung: waehrung,
                    eroeffnungsdatum: eroeffnungsdatum
                })

            if (giroError) {
                console.error("Fehler beim Erstellen des Girokontos:", giroError)
                alert("Fehler beim Girokonto-Insert. Datenbank-Spalten der Tabelle 'girokonto' prüfen!")
                return
            }

            setName("")
            setBank("")
            setIban("")
            setEinzahlung_bei_eroeffnung("")
            setWaehrung("")
            setEroeffnungsdatum("")
            setModalOffenHinzu(false)

            // Daten neu laden
            ladeGirokonto()

        } catch (err) {
            console.error("Unerwarteter Fehler:", err)
        }
    }

    const bearbeitenOeffnen = (eintrag) => {
        setZuBearbeiten(eintrag)
        setName(eintrag.asset.asset_name || "")
        setBank(eintrag.name_der_bank || "")
        setIban(eintrag.iban || "")
        setEinzahlung_bei_eroeffnung(eintrag.einzahlung_bei_eroeffnung || "")
        setWaehrung(eintrag.waehrung || "")
        setEroeffnungsdatum(eintrag.eroeffnungsdatum || "")
        setModalOffen(true)
    }

    const eintragLoeschen = async (id) => {
        await supabase.from("girokonto").delete().eq("id", id)
        ladeGirokonto()
    }

    const girokontoSpeichern = async () => {
        if (!zuBearbeiten) return

        await supabase
            .from("girokonto")
            .update({
                name_der_bank: bank,
                iban: iban,
                einzahlung_bei_eroeffnung: parseFloat(einzahlung_bei_eroeffnung) || 0,
                waehrung: waehrung,
                eroeffnungsdatum: eroeffnungsdatum
            })
            .eq("id", zuBearbeiten.id)

        setModalOffen(false)
        setZuBearbeiten(null)
        ladeGirokonto()
    }

    return (
        <div>
            <h2>Girokonto</h2>

            <ul>
                {listeGirokonto.map((e) => (
                    <li key={e.id}>
                        {e.asset.asset_name} ({e.name_der_bank}) | {e.iban} | {e.einzahlung_bei_eroeffnung} {e.waehrung} | {e.eroeffnungsdatum}
                        <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
                        <button onClick={() => eintragLoeschen(e.id)}>🗑️</button>
                    </li>
                ))}
            </ul>

            <button onClick={() => setModalOffenHinzu(true)}>Girokonto hinzufügen</button>

            {modalOffenHinzu && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", minWidth: "300px" }}>
                        <h4>Neues Girokonto hinzufügen</h4>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset Name (z.B. Hauptkonto)" />
                        <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank Name (z.B. Sparkasse)" />
                        <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="IBAN" />
                        <input value={einzahlung_bei_eroeffnung} onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} placeholder="Einzahlung bei Eröffnung" type="number" />
                        <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Währung (z.B. EUR)" />
                        <input type="date" value={eroeffnungsdatum} onChange={(e) => setEroeffnungsdatum(e.target.value)} />

                        <button onClick={girokontoHinzufuegen}>Girokonto hinzufügen</button>
                        <button onClick={() => setModalOffenHinzu(false)}>Abbrechen</button>
                    </div>
                </div>
            )}

            {modalOffen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", minWidth: "300px" }}>
                        <h4>Girokonto bearbeiten</h4>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset Name" />
                        <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank" />
                        <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="IBAN" />
                        <input value={einzahlung_bei_eroeffnung} onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} placeholder="Einzahlung bei Eröffnung" type="number" />
                        <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Währung" />
                        <input type="date" value={eroeffnungsdatum} onChange={(e) => setEroeffnungsdatum(e.target.value)} />

                        <button onClick={girokontoSpeichern}>Speichern</button>
                        <button onClick={() => setModalOffen(false)}>Abbrechen</button>
                    </div>
                </div>
            )}
        </div>
    )
}