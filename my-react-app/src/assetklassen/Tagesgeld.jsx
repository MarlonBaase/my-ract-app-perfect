import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Tagesgeld() {
    const [listeGeldmarkt, setListeGeldmarkt] = useState([])
    const [name, setName] = useState("")
    const [bank, setBank] = useState("")
    const [iban, setIban] = useState("")
    const [wert, setWert] = useState("")
    const [summe, setSumme] = useState("")
    const [waehrung, setWaehrung] = useState("")
    const [eroeffnet_am, setEroeffnet_am] = useState("")
    const [besonderheiten, setBesonderheiten] = useState("")
    const [zinssatz, setZinssatz] = useState("")
    const [endet_am, setEndet_am] = useState("")
    const [modalOffen, setModalOffen] = useState(false)  // sichtbar: true oder false, nicht ""
    const [zuBearbeiten, setZuBearbeiten] = useState(null)


    useEffect(() => {
        const init = async () => {
            await ladeTagesgeld()
        }
        init()
    }, [])

    const ladeTagesgeld = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase
            .from("geldmarkt")
            .select("*")
            .eq("user_id", user.id)
            .eq("typ", "tagesgeld")
            .order("name", { ascending: true })

        if (data) setListeGeldmarkt(data)
    }

    const tagesgeldHinzufuegen = async () => {
        if (!name || !bank || !iban || !wert || !summe || !waehrung || !eroeffnet_am || !zinssatz || !endet_am) return
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from("geldmarkt").insert({
            user_id: user.id,
            typ: "tagesgeld",
            name: name,
            bank: bank,
            iban: iban,
            wert: wert,
            einlage_summe: summe,
            waehrung: waehrung,
            eroeffnet_am: eroeffnet_am,
            zinssatz: zinssatz,
            endet_am: endet_am
        })
        setName("")
        setBank("")
        setIban("")
        setWert("")
        setSumme("")
        setWaehrung("")
        setEroeffnet_am("")
        setZinssatz("")
        setEndet_am("")
        ladeTagesgeld()
    }

    const bearbeitenOeffnen = (eintrag) => {
        setZuBearbeiten(eintrag)
        setName(eintrag.name)
        setBank(eintrag.bank)
        setIban(eintrag.iban)
        setWert(eintrag.wert)
        setSumme(eintrag.summe)
        setWaehrung(eintrag.waehrung)
        setEroeffnet_am(eintrag.eroeffnet_am)
        setZinssatz(eintrag.zinssatz)
        setEndet_am(eintrag.endet_am)
        setModalOffen(true)
    }

    const eintragLoeschen = async (id) => {
        await supabase.from("geldmarkt").delete().eq("id", id)
        ladeTagesgeld()
    }

    const tagesgeldSpeichern = async () => {

        await supabase.from("geldmarkt").update({
            typ: "tagesgeld",
            name: name,
            bank: bank,
            iban: iban,
            wert: wert,
            einlage_summe: summe,
            waehrung: waehrung,
            eroeffnet_am: eroeffnet_am,
            zinssatz: zinssatz,
            endet_am: endet_am
        }).eq("id", zuBearbeiten.id)
        setModalOffen(false)
        ladeTagesgeld()
    }


    return (
        <div>
            <h2>Tagesgeldkonto</h2>

            {/* Liste */}

            <ul>
                {listeGeldmarkt.map((e) => (
                    <li key={e.id}>
                        {e.name} | {e.bank} |  {e.iban} | {e.wert} | {e.einlage_summe} | {e.waehrung} | {e.eroeffnet_am} | {e.zinssatz} | {e.endet_am}
                        <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
                        <button onClick={() => eintragLoeschen(e.id, e.typ)}>🗑️</button>
                    </li>
                ))}
            </ul>


            <div>
                <h4>Neues Tagesgeldkonto hinzufügen</h4>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank" />
                <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="Iban" />
                <input value={wert} onChange={(e) => setWert(e.target.value)} placeholder="Wert" />
                <input value={summe} onChange={(e) => setSumme(e.target.value)} placeholder="Einlage Summe" />
                <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Waehrung" />
                <input value={eroeffnet_am} onChange={(e) => setEroeffnet_am(e.target.value)} placeholder="Eroefnnet am" />
                <input value={zinssatz} onChange={(e) => setZinssatz(e.target.value)} placeholder="Zinssatz" />
                <input value={endet_am} onChange={(e) => setEndet_am(e.target.value)} placeholder="Endet am" />

                <button onClick={tagesgeldHinzufuegen}>Tagesgeldkonto hinzufügen</button>

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
                        <h4>Tagesgeldkonto bearbeiten</h4>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                        <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank" />
                        <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="Iban" />
                        <input value={wert} onChange={(e) => setWert(e.target.value)} placeholder="Wert" />
                        <input value={summe} onChange={(e) => setSumme(e.target.value)} placeholder="Einlage Summe" />
                        <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Waehrung" />
                        <input value={eroeffnet_am} onChange={(e) => setEroeffnet_am(e.target.value)} placeholder="Eroefnnet am" />
                        <input value={zinssatz} onChange={(e) => setZinssatz(e.target.value)} placeholder="Zinssatz" />
                        <input value={endet_am} onChange={(e) => setEndet_am(e.target.value)} placeholder="Endet am" />
                        <button onClick={tagesgeldSpeichern}>Speichern</button>
                        <button onClick={() => setModalOffen(false)}>Abbrechen</button>
                    </div>
                </div>
            )}
        </div>
    )
}