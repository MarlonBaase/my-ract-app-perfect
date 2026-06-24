import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Festgeld() {
    const [listeFestgeld, setListeFestgeld] = useState([])
    const [name, setName] = useState("")
    const [bank, setBank] = useState("")
    const [iban, setIban] = useState("")
    const [wert, setWert] = useState("")
    const [einlage_summe, setSumme] = useState("")
    const [waehrung, setWaehrung] = useState("")
    const [eroeffnet_am, setEroeffnet_am] = useState("")
    const [besonderheiten, setBesonderheiten] = useState("")
    const [modalOffen, setModalOffen] = useState(false)  // sichtbar: true oder false, nicht ""
    const [zuBearbeiten, setZuBearbeiten] = useState(null)




    const ladeFestgeld = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase
            .from("festgeld")
            .select("*")
            .eq("user_id", user.id)
            .eq("typ", "festgeld")  
            .order("name", { ascending: true })

        if (data) setListeFestgeld(data)
    }

    useEffect(() => {
        const init = async () => {
            await ladeFestgeld()
        }
        init()
    }, [])

    const festgeldHinzufuegen = async () => {
        if (!name || !bank || !iban || !wert || !einlage_summe || !waehrung || !eroeffnet_am) return
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from("festgeld").insert({
            user_id: user.id,
            typ: "festgeld",
            name: name,
            bank: bank,
            iban: iban,
            wert: parseFloat(wert) || 0,          
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
        ladeFestgeld()
    }

        



    const bearbeitenOeffnen = (eintrag) => {
        setZuBearbeiten(eintrag)
        setName(eintrag.name)
        setBank(eintrag.bank)
        setIban(eintrag.iban)
        setWert(eintrag.wert)
        setSumme(eintrag.einlage_summe)
        setWaehrung(eintrag.waehrung)
        setEroeffnet_am(eintrag.eroeffnet_am)
        setModalOffen(true)
    }

    const eintragLoeschen = async (id) => {
        await supabase.from("festgeld").delete().eq("id", id)
        ladeFestgeld()
    }

    const festgeldSpeichern = async () => {

        await supabase.from("festgeld").update({
            typ: "festgeld",
            name: name,
            bank: bank,
            iban: iban,
            wert: parseFloat(wert) || 0,          
            einlage_summe: parseFloat(einlage_summe) || 0,
            waehrung: waehrung,
            eroeffnet_am: eroeffnet_am
        }).eq("id", zuBearbeiten.id)
        setModalOffen(false)
        ladeFestgeld()
    }


    return (
        <div>
            <h2>Festgeld</h2>

            {/* Liste */}

            <ul>
                {listeFestgeld.map((e) => (
                    <li key={e.id}>
                        {e.name} | {e.bank} |  {e.iban} | {e.wert} | {e.einlage_summe} | {e.waehrung} | {e.eroeffnet_am}
                        <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
                        <button onClick={() => eintragLoeschen(e.id, e.typ)}>🗑️</button>
                    </li>
                ))}
            </ul>


            <div>
                <h4>Neues Festgeldkonto hinzufügen</h4>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank" />
                <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="Iban" />
                <input value={wert} onChange={(e) => setWert(e.target.value)} placeholder="Wert" />
                <input value={einlage_summe} onChange={(e) => setSumme(e.target.value)} placeholder="Einlage Summe" />
                <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Waehrung" />
                <input type="date" value={eroeffnet_am} onChange={(e) => setEroeffnet_am(e.target.value)} placeholder="Eroefnnet am" />


                <button onClick={festgeldHinzufuegen}>Festgeldkonto hinzufügen</button>

            </div>
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
                        <h4>Festgeldkonto bearbeiten</h4>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                        <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank" />
                        <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="Iban" />
                        <input value={wert} onChange={(e) => setWert(e.target.value)} placeholder="Wert" />
                        <input value={einlage_summe} onChange={(e) => setSumme(e.target.value)} placeholder="Einlage Summe" />
                        <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Waehrung" />
                        <input type="date" value={eroeffnet_am} onChange={(e) => setEroeffnet_am(e.target.value)} placeholder="Eroefnnet am" />
                        <button onClick={festgeldSpeichern}>Speichern</button>
                        <button onClick={() => setModalOffen(false)}>Abbrechen</button>
                    </div>
                </div>
            )}
        </div>
    )
}