import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Girokonto() {
    const [listeGirokonto, setListeGirokonto] = useState([])
    const [name, setName] = useState("")
    const [bank, setBank] = useState("")
    const [iban, setIban] = useState("")
    const [wert, setWert] = useState("")
    const [einzahlung_bei_eroeffnung, setEinzahlung_bei_eroeffnung] = useState("")
    const [waehrung, setWaehrung] = useState("")
    const [eroeffnungsdatum, setEroeffnungsdatum] = useState("")
    const [besonderheiten, setBesonderheiten] = useState("")
    const [modalOffen, setModalOffen] = useState(false)
    const [modalOffenHinzu, setModalOffenHinzu] = useState(false)
    const [zuBearbeiten, setZuBearbeiten] = useState(null)




    const ladeGirokonto = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase
            .from("girokonto")
            .select("*")
            .eq("benutzer_id", user.id)
            .order("name", { ascending: true })

        if (data) setListeGirokonto(data)
    }

    useEffect(() => {
        const init = async () => {
            await ladeGirokonto()
        }
        init()
    }, [])

    const girokontoHinzufuegen = async () => {
        if (!name || !bank || !iban || !wert || !einzahlung_bei_eroeffnung || !waehrung || !eroeffnungsdatum) return
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
                .select() // .select() erzwingt die Rückgabe des erstellten Datensatzes

            if (assetError || !assetData || assetData.length === 0) {
                console.error("Fehler beim Erstellen des Assets:", assetError)
                alert("Fehler beim Erstellen des übergeordneten Assets. Spaltennamen in der Tabelle 'asset' prüfen!")
                return
            }

            const asset_id = assetData[0].id

            // 2. Girokonto eintragen (verknüpft mit asset_id)
            const { error: giroError } = await supabase
                .from("girokonto")
                .insert({
                    benutzer_id: user.id,
                    asset_id: asset_id,
                    name_der_bank: bank,
                    asset_name: name,
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

            // Formular zurücksetzen & Modal schließen
            setName("")
            setBank("")
            setIban("")
            setWert("")
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
        setName(eintrag.name_der_bank)
        setBank(eintrag.name_der_bank)
        setIban(eintrag.iban)
        setWert(eintrag.einzahlung_bei_eroeffnung)
        setWaehrung(eintrag.waehrung)
        setEroeffnungsdatum(eintrag.eroeffnungsdatum)
        setModalOffen(true)
    }

    const eintragLoeschen = async (id) => {
        await supabase.from("girokonto").delete().eq("id", id)
        ladeGirokonto()
    }

    const girokontoSpeichern = async () => {

        await supabase.from("girokonto").update({
            name_der_bank: bank,
            iban: iban,
            einzahlung_bei_eroeffnung: parseFloat(einzahlung_bei_eroeffnung) || 0,
            waehrung: waehrung,
            eroeffnungsdatum: eroeffnungsdatum
        }).eq("id", zuBearbeiten.id)
        setModalOffen(false)
        ladeGirokonto()
    }


    return (
        <div>
            <h2>Girokonto</h2>

            {/* Liste */}

            <ul>
                {listeGirokonto.map((e) => (
                    <li key={e.id}>
                        {e.name_der_bank} | {e.iban} | {e.einzahlung_bei_eroeffnung} | {e.waehrung} | {e.eroeffnungsdatum}
                        <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
                        <button onClick={() => eintragLoeschen(e.id)}>🗑️</button>
                    </li>
                ))}
            </ul>


            <button onClick={() => setModalOffenHinzu(true)}>Girokonto hinzufügen</button>
            {modalOffenHinzu && (
                <div style={{
                    // Overlay: deckt die ganze Seite ab
                    position: "fixed",    // bleibt immer an der gleichen Stelle, egal wie man scrollt
                    top: 0, left: 0,      // startet oben links
                    width: "100%", height: "100%",  // bedeckt die ganze Seite
                    backgroundColor: "rgba(0,0,0,0.5)",  // schwarz mit 50% Transparenz
                    display: "flex", alignItems: "center", justifyContent: "center"  // zentriert die Box
                }}>
                    <div style={{
                        // Modal Box: das eigentliche Fenster
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        minWidth: "300px"
                    }}>
                        <h4>Neues Girokonto hinzufügen</h4>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                        <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank" />
                        <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="Iban" />
                        <input value={wert} onChange={(e) => setWert(e.target.value)} placeholder="Wert" />
                        <input value={einzahlung_bei_eroeffnung} onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} placeholder="Einzahlung bei Eröffnung" />
                        <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Waehrung" />
                        <input type="date" value={eroeffnungsdatum} onChange={(e) => setEroeffnungsdatum(e.target.value)} placeholder="Eroeffnungsdatum" />
                        <button onClick={() => {girokontoHinzufuegen(); setModalOffenHinzu(false)}}>Girokonto hinzufügen</button>
                        <button onClick={() => setModalOffenHinzu(false)}>Abbrechen</button>
                    </div>
                </div>
            )}
            {modalOffen && (
                <div style={{
                    // Overlay: deckt die ganze Seite ab
                    position: "fixed",    // bleibt immer an der gleichen Stelle, egal wie man scrollt
                    top: 0, left: 0,      // startet oben links
                    width: "100%", height: "100%",  // bedeckt die ganze Seite
                    backgroundColor: "rgba(0,0,0,0.5)",  // schwarz mit 50% Transparenz
                    display: "flex", alignItems: "center", justifyContent: "center"  // zentriert die Box
                }}>
                    <div style={{
                        // Modal Box: das eigentliche Fenster
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        minWidth: "300px"
                    }}>
                        <h4>Girokonto bearbeiten</h4>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                        <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank" />
                        <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="Iban" />
                        <input value={wert} onChange={(e) => setWert(e.target.value)} placeholder="Wert" />
                        <input value={einzahlung_bei_eroeffnung} onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} placeholder="Einzahlung bei Eröffnung" />
                        <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Waehrung" />
                        <input type="date" value={eroeffnungsdatum} onChange={(e) => setEroeffnungsdatum(e.target.value)} placeholder="Eroeffnungsdatum" />
                        <button onClick={() => {girokontoSpeichern(); setModalOffen(false)}}>Speichern</button>
                        <button onClick={() => setModalOffen(false)}>Abbrechen</button>
                    </div>
                </div>
            )}
        </div>
    )
}