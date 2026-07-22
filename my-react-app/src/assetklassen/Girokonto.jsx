import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";

export default function Girokonto() {
    const [listeGirokonto, setListeGirokonto] = useState([])
    const [name, setName] = useState("")
    const [bank, setBank] = useState("")
    const [iban, setIban] = useState("")
    const [kontoinhaber, setKontoinhaber] = useState("")
    const [istAktiv, setIstAktiv] = useState("")
    const [hauptkonto, setHauptkonto] = useState(true)
    const [elternkonto, setElternkonto] = useState("")
    const [elternkontoListe, setElternkontoListe] = useState([]); // Das Array für die Optionen
    const [ausgewaehltesElternkonto, setAusgewaehltesElternkonto] = useState(""); // Der ausgewählte Wert
    const [dispoLimit, setDispoLimit] = useState("")
    const [bic, setBic] = useState("")
    const [zinssatz, setZinssatz] = useState("")
    const [einzahlung_bei_eroeffnung, setEinzahlung_bei_eroeffnung] = useState("")
    const [waehrung, setWaehrung] = useState("")
    const [eroeffnungsdatum, setEroeffnungsdatum] = useState("")
    const [modalOffen, setModalOffen] = useState(false)
    const [modalOffenHinzu, setModalOffenHinzu] = useState(false)
    const [zuBearbeiten, setZuBearbeiten] = useState(null)
    const [eintraege, setEintraege] = useState([])
    const [modalOffenTransaktionen, setModalOffenTransaktionen] = useState(false)
    const [listeTransaktionenGirokonto, setListeTransaktionenGirokonto] = useState([])
    const [modalTranskationenHinzufuegen, setModalTranskationenHinzufuegen] = useState(false);
    const [transaktionsBeschreibung, setTransaktionsBeschreibung] = useState("");
    const [transaktionsBetrag, setTransaktionsBetrag] = useState("");
    const [transaktionsKategorie, setTransaktionsKategorie] = useState("");
    const [transaktionsTyp, setTransaktionsTyp] = useState("");
    const [wiederkehrendaktiv, setWiederkehrendaktiv] = useState(false);
    const [assets, setAssets] = useState([]);
    const [ausgewaehltesAsset, setAusgewaehltesAsset] = useState("");
    const [kategorien, setKategorien] = useState([]);
    const [intervall, setIntervall] = useState("");

    const ladeGirokonto = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
            .from("girokonto")
            .select(`*, 
                asset!inner(
                    benutzer_id,
                    asset_name,
                    asset_id
                )
            `)
            .eq("asset.benutzer_id", user.id)
            .order('asset_name', { referencedTable: 'asset', ascending: true });

        if (handleApiError(error, "Girokonto laden")) return;

        if (data) setListeGirokonto(data)
    }

    const transaktionenOeffnen = async (assetId) => {
        
        if (!assetId) {
            console.warn("Keine Asset-ID vorhanden!");
            return;
        }
        
        setModalOffenTransaktionen(true)
        setAusgewaehltesAsset(assetId)

        const { data, error } = await supabase
            .from("transaktionsprotokoll")
            .select("*")
            .eq("asset_id", assetId)
            .order('datum', { ascending: false });

        if (handleApiError(error, "Transaktionen öffnen")) return;
        if (data) setListeTransaktionenGirokonto(data)
    }



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
                    eroeffnungsdatum: eroeffnungsdatum,
                    bemerkung: transaktionsBeschreibung,
                    kontoinhaber: kontoinhaber,
                    istAktiv: true,
                    hauptkonto: hauptkonto,
                    elternkonto: elternkonto,
                    dispoLimit: dispoLimit,
                    bic: bic,
                    zinssatz: zinssatz
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
            setTransaktionsBeschreibung("")
            setKontoinhaber("")
            setIstAktiv("")
            setHauptkonto("")
            setElternkonto("")
            setDispoLimit("")
            setBic("")
            setZinssatz("")
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
        setTransaktionsBeschreibung(eintrag.bemerkung || "")
        setKontoinhaber(eintrag.kontoinhaber || "")
        setIstAktiv(eintrag.istAktiv || "")
        setHauptkonto(eintrag.hauptkonto || "")
        setElternkonto(eintrag.elternkonto || "")
        setDispoLimit(eintrag.dispoLimit || "")
        setBic(eintrag.bic || "")
        setZinssatz(eintrag.zinssatz || "")
        setModalOffen(true)
    }

    const eintragLoeschen = async () => {
        const { error } = await supabase
            .from("girokonto")
            .delete()
            .eq("asset_id", zuBearbeiten.asset_id)

        if (handleApiError(error, "Eintrag löschen")) return;
        ladeGirokonto()
    }

    const girokontoSpeichern = async () => {

        if (!zuBearbeiten) return;

        const { error: assetError } = await supabase
            .from("asset")
            .update({ asset_name: name })
            .eq("asset_id", zuBearbeiten.asset_id);

        if (handleApiError(assetError, "Asset Name updaten")) return;

        const { error: giroError } = await supabase
            .from("girokonto")
            .update({
                name_der_bank: bank,
                iban: iban,
                einzahlung_bei_eroeffnung: parseFloat(einzahlung_bei_eroeffnung) || 0,
                waehrung: waehrung,
                eroeffnungsdatum: eroeffnungsdatum,
                bemerkung: transaktionsBeschreibung,
                kontoinhaber: kontoinhaber,
                istAktiv: istAktiv,
                hauptkonto: hauptkonto,
                elternkonto: elternkonto,
                dispoLimit: dispoLimit,
                bic: bic,
                zinssatz: zinssatz
            })
            .eq("asset_id", zuBearbeiten.asset_id);

        if (handleApiError(giroError, "Girokontodaten updaten")) return;

        setModalOffen(false)
        setZuBearbeiten(null)
        ladeGirokonto()
    }

    const transaktionHinzufuegen = async () => {
        if (!transaktionsBeschreibung || !transaktionsBetrag || !transaktionsKategorie || !transaktionsTyp) return;
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase.from("transaktionsprotokoll").insert({
            benutzer_id: user.id,
            bemerkung: transaktionsBeschreibung,
            betrag: parseFloat(transaktionsBetrag),
            kategorie_id: transaktionsKategorie,
            asset_id: ausgewaehltesAsset,
            assetklasse: "girokonto",
            typ: transaktionsTyp
        });

        if (handleApiError(error, "Transaktion hinzufügen")) return;

        setTransaktionsBeschreibung("");
        setTransaktionsBetrag("");
        setTransaktionsKategorie("");
        setTransaktionsTyp("");

        ladeGirokonto();
        transaktionenOeffnen(ausgewaehltesAsset);
        setModalTranskationenHinzufuegen(false);
    };

    const transaktionSchließen = () => {
        setModalTranskationenHinzufuegen(false);
    };

    const ladeKategorien = async () => {
        const { data, error } = await supabase
            .from("transaktionskategorie")
            .select("*")
            .order("name", { ascending: true });

        if (data) setKategorien(data);
        if (handleApiError(error, "Kategorie laden")) return;
    };

    const ladeElternkontoListe = async () => {
        const { data } = await supabase
            .from("girokonto")
            .select("*")
            .eq("hauptkonto", true)
            .order("hauptkonto", { ascending: true });

        if (data) setElternkonto(data);
    };

    useEffect(() => {
        const init = async () => {
            try {
                await ladeGirokonto()
                await ladeKategorien();
                await ladeElternkontoListe();
            } catch (err) {
                console.error("Fehler in init:", err);
            }
        };
        init();
    }, []);


    return (
        <div>
            <h2>Girokonto</h2>

            <ul>
                {listeGirokonto.map((e) => (
                    <li key={e.id}>
                        {e.asset.asset_name}| {e.name_der_bank} | {e.iban} | {e.einzahlung_bei_eroeffnung} {e.waehrung} | {e.bemerkung} | {e.eroeffnungsdatum} | {e.kontoinhaber} | {e.istAktiv} | {e.hauptkonto} | {e.elternkonto} | {e.dispoLimit} | {e.bic} | {e.zinssatz}
                        <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
                        <button onClick={() => eintragLoeschen(e.id)}>🗑️</button>
                        <button onClick={() => transaktionenOeffnen(e.asset.asset_id)}>💰</button>
                    </li>
                ))}
            </ul>

            <button onClick={() => {
                setModalOffenHinzu(true),
                setZuBearbeiten(""),
                setName(""),
                setBank(""),
                setIban(""),
                setEinzahlung_bei_eroeffnung(""),
                setWaehrung(""),
                setEroeffnungsdatum(""),
                setTransaktionsBeschreibung(""),
                setKontoinhaber(""),
                setIstAktiv(""),
                setHauptkonto(""),
                setElternkonto(""),
                setDispoLimit(""),
                setBic(""),
                setZinssatz("")
            }}>Girokonto hinzufügen</button>

            {modalOffenTransaktionen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", minWidth: "300px" }}>

                        {listeTransaktionenGirokonto.map((transaktion) => (
                            <li key={transaktion.id}>
                                {transaktion.betrag} {transaktion.waehrung} | {transaktion.datum}
                            </li>
                        ))}
                        <button onClick={() => setModalOffenTransaktionen(false)}>Schließen</button>
                        <button onClick={() => setModalTranskationenHinzufuegen(true)}>Transaktion hinzufügen</button>
                    </div>
                </div>
            )}

            {modalOffenHinzu && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0,
                    width: "100%", height: "100%",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "24px",
                        borderRadius: "12px",
                        minWidth: "320px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                    }}>
                        <h4>Neues Girokonto hinzufügen</h4>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset Name (z.B. Hauptkonto)" />
                        <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank Name (z.B. Sparkasse)" />
                        <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="IBAN" />
                        <input value={einzahlung_bei_eroeffnung} onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} placeholder="Einzahlung bei Eröffnung" type="number" />
                        <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Währung (z.B. EUR)" />
                        <input type="date" value={eroeffnungsdatum} onChange={(e) => setEroeffnungsdatum(e.target.value)} />
                        <input value={transaktionsBeschreibung} onChange={(e) => setTransaktionsBeschreibung(e.target.value)} placeholder="Bemerkung" />
                        <input value={kontoinhaber} onChange={(e) => setKontoinhaber(e.target.value)} placeholder="Kontoinhaber" />
                        <label for="hauptkonto">Hauptkonto</label>
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
                        <input value={dispoLimit} onChange={(e) => setDispoLimit(e.target.value)} placeholder="Dispo Limit" />
                        <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BIC" />
                        <input value={zinssatz} onChange={(e) => setZinssatz(e.target.value)} placeholder="Zinssatz" />

                        <button onClick={() => { girokontoHinzufuegen, setModalOffenHinzu(false) }}>Speichern</button>
                        <button onClick={() => { setModalOffenHinzu(false) }}>Abbrechen</button>
                    </div>
                </div>

            )}



            {
                modalOffen && (
                    <div style={{
                        position: "fixed",
                        top: 0, left: 0,
                        width: "100%", height: "100%",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: "white",
                            padding: "24px",
                            borderRadius: "12px",
                            minWidth: "320px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                        }}>
                            <h4>Girokonto bearbeiten</h4>
                            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset Name" />
                            <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank" />
                            <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="IBAN" />
                            <input value={einzahlung_bei_eroeffnung} onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} placeholder="Einzahlung bei Eröffnung" type="number" />
                            <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="Währung" />
                            <input type="date" value={eroeffnungsdatum} onChange={(e) => setEroeffnungsdatum(e.target.value)} />
                            <input value={transaktionsBeschreibung} onChange={(e) => setTransaktionsBeschreibung(e.target.value)} placeholder="Bemerkung" />
                            <input value={kontoinhaber} onChange={(e) => setKontoinhaber(e.target.value)} placeholder="Kontoinhaber" />
                            <input title="Aktiv" type="checkbox" id="istAktiv" checked={istAktiv} onChange={(e) => setIstAktiv(e.target.checked)} />
                            <input title="Hauptkonto" type="checkbox" id="hauptkonto" checked={hauptkonto} onChange={(e) => setHauptkonto(e.target.checked)} />
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
                            <input value={dispoLimit} onChange={(e) => setDispoLimit(e.target.value)} placeholder="Dispo Limit" />
                            <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BIC" />
                            <input value={zinssatz} onChange={(e) => setZinssatz(e.target.value)} placeholder="Zinssatz" />



                            <button onClick={() => { girokontoSpeichern, setModalOffen(false) }}>Speichern</button>
                            <button onClick={() => { setModalOffen(false) }}>Abbrechen</button>
                        </div>
                    </div>
                )
            }

            {
                modalTranskationenHinzufuegen && (

                    <div style={{
                        position: "fixed",
                        top: 0, left: 0,
                        width: "100%", height: "100%",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: "white",
                            padding: "24px",
                            borderRadius: "12px",
                            minWidth: "320px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                        }}>
                            <h4 style={{ marginBottom: "8px", fontWeight: "600" }}>Transaktion hinzufügen</h4>
                            <input
                                value={transaktionsBeschreibung}
                                onChange={(e) => setTransaktionsBeschreibung(e.target.value)}
                                placeholder="Beschreibung"
                                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                            />
                            <input
                                value={transaktionsBetrag}
                                onChange={(e) => setTransaktionsBetrag(e.target.value)}
                                placeholder="Betrag"
                                type="number"
                                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                            />
                            <select
                                value={transaktionsKategorie}
                                onChange={(e) => setTransaktionsKategorie(e.target.value)}
                                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                            >
                                <option value="">Kategorie wählen</option>
                                {kategorien.map((k) => (
                                    <option key={k.id} value={k.id}>{k.name}</option>
                                ))}
                            </select>
                            <select
                                value={transaktionsTyp}
                                onChange={(e) => setTransaktionsTyp(e.target.value)}
                                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                            >
                                <option value="">Typ wählen</option>
                                <option value="ausgabe">Ausgabe</option>
                                <option value="einnahme">Einnahme</option>
                            </select>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                    type="checkbox"
                                    id="wiederkehrend"
                                    checked={wiederkehrendaktiv}
                                    onChange={(e) => setWiederkehrendaktiv(e.target.checked)}
                                />
                                <label htmlFor="wiederkehrend">Wiederkehrend</label>
                            </div>

                            {wiederkehrendaktiv && (
                                <select
                                    value={intervall}
                                    onChange={(e) => setIntervall(e.target.value)}
                                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                                >
                                    <option value="">Intervall wählen</option>
                                    <option value="täglich">Täglich</option>
                                    <option value="wöchentlich">Wöchentlich</option>
                                    <option value="monatlich">Monatlich</option>
                                    <option value="jährlich">Jährlich</option>
                                </select>
                            )}

                            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                                <button
                                    onClick={transaktionHinzufuegen}
                                    style={{ flex: 1, padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                >
                                    Hinzufügen
                                </button>
                                <button
                                    onClick={transaktionSchließen}
                                    style={{ flex: 1, padding: "10px", backgroundColor: "#e2e8f0", color: "#475569", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                >
                                    Abbrechen
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}