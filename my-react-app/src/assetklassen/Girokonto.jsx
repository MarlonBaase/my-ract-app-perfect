import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Girokonto() {
    const [listeGirokonto, setListeGirokonto] = useState([])
    const [name, setName] = useState("")
    const [bank, setBank] = useState("")
    const [iban, setIban] = useState("")
    const [wert, setWert] = useState("")
    const [einlage_summe, setSumme] = useState("")
    const [waehrung, setWaehrung] = useState("")
    const [eroeffnet_am, setEroeffnet_am] = useState("")
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
        if (!name || !bank || !iban || !wert || !einlage_summe || !waehrung || !eroeffnet_am) return
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from("girokonto").insert({
            benutzer_id: user.id,
            name_der_bank: bank,
            iban: iban,
            einlage_summe: parseFloat(einlage_summe) || 0,
            waehrung: waehrung,
            eroeffnet_am: eroeffnet_am
        })
        setName("")
        setBank("")
        setIban("")
        setWert("")
        setSumme("")
        setWaehrung("")
        setEroeffnet_am("")
        ladeGirokonto()
    }





    const bearbeitenOeffnen = (eintrag) => {
        setZuBearbeiten(eintrag)
        setName(eintrag.name_der_bank)
        setBank(eintrag.name_der_bank)
        setIban(eintrag.iban)
        setWert(eintrag.einlage_summe)
        setWaehrung(eintrag.waehrung)
        setEroeffnet_am(eintrag.eroeffnet_am)
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
            einlage_summe: parseFloat(einlage_summe) || 0,
            waehrung: waehrung,
            eroeffnet_am: eroeffnet_am
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
                        {e.name_der_bank} | {e.iban} | {e.einlage_summe} | {e.waehrung} | {e.eroeffnet_am}
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
                        <input value={einlage_summe} onChange={(e) => setSumme(e.target.value)} placeholder="Einlage Summe" />
                        <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Waehrung" />
                        <input type="date" value={eroeffnet_am} onChange={(e) => setEroeffnet_am(e.target.value)} placeholder="Eroefnnet am" />
                        <button onClick={girokontoHinzufuegen}>Girokonto hinzufügen</button>
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
                        <input value={einlage_summe} onChange={(e) => setSumme(e.target.value)} placeholder="Einlage Summe" />
                        <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Waehrung" />
                        <input type="date" value={eroeffnet_am} onChange={(e) => setEroeffnet_am(e.target.value)} placeholder="Eroefnnet am" />
                        <button onClick={girokontoSpeichern}>Speichern</button>
                        <button onClick={() => setModalOffen(false)}>Abbrechen</button>
                    </div>
                </div>
            )}
        </div>
    )
}