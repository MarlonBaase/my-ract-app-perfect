import { useEffect, useState, useContext } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import { SettingsContext } from '../SettingsContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { data } from "react-router-dom";

export default function Tagesgeld() {
    const [listeTagesgeld, setListeTagesgeld] = useState([])
    const [name, setName] = useState("")
    const [bank, setBank] = useState("")
    const [iban, setIban] = useState("")
    const [kontoinhaber, setKontoinhaber] = useState("")
    const [ist_aktiv, setIstAktiv] = useState(true)
    const [bic, setBic] = useState("")
    const [zinssatz, setZinssatz] = useState("")
    const [einzahlung_bei_eroeffnung, setEinzahlung_bei_eroeffnung] = useState("")
    const [waehrung, setWaehrung] = useState("EUR")
    const [eroeffnungsdatum, setEroeffnungsdatum] = useState("")
    const [modalOffen, setModalOffen] = useState(false)
    const [modalOffenHinzu, setModalOffenHinzu] = useState(false)
    const [zuBearbeiten, setZuBearbeiten] = useState(null)
    const [modalOffenTransaktionen, setModalOffenTransaktionen] = useState(false)
    const [listeTransaktionenTagesgeld, setListeTransaktionenTagesgeld] = useState([])
    const [modalTranskationenHinzufuegen, setModalTranskationenHinzufuegen] = useState(false);
    const [transaktionsNotizen, setTransaktionsNotizen] = useState("");
    const [transaktionsBetrag, setTransaktionsBetrag] = useState("");
    const [transaktionsKategorie, setTransaktionsKategorie] = useState("");
    const [transaktionsTyp, setTransaktionsTyp] = useState("");
    const [wiederkehrendaktiv, setWiederkehrendaktiv] = useState(false);
    const [ausgewaehltesAsset, setAusgewaehltesAsset] = useState("");
    const [kategorien, setKategorien] = useState([]);
    const [zinssintervall, setZinssintervall] = useState("");
    const [referenzkonto, setReferenzkonto] = useState("");
    const [freistellungsauftrag, setFreistellungsauftrag] = useState("");
    const [aktionszins, setAktionszins] = useState("");
    const [ablaufdatum_aktionszins, setAblaufdatum_aktionszins] = useState("");
    const [notgroschen, setNotgroschen] = useState(false);
    const [einlagensicherung, setEinlagensicherung] = useState("");
    const [sparrate, setSparrate] = useState("");
    const [sparziel, setSparziel] = useState("");
    const [mindestbetrag, setMindestbetrag] = useState("");
    const [ausgewaehltesReferenzkonto, setAusgewaehltesReferenzkonto] = useState("");
    const [listeReferenzkonto, setListeReferenzkonto] = useState([]);
    const [ist_referenzkonto, setIstReferenzkonto] = useState(false);
    const [intervall, setIntervall] = useState("");
    const [assets, setAssets] = useState([]);
    const [errors, setErrors] = useState({});

    const { ansicht } = useContext(SettingsContext);




    const berechneZiel = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
            .from("tagesgeldkonto")
            .select(`*, 
                asset!inner(
                    benutzer_id,
                    asset_name,
                    asset_id,
                    transaktionsprotokoll(betrag, typ)
                )
            `)
            .eq("asset.benutzer_id", user.id)
            .order('asset_name', { referencedTable: 'asset', ascending: true });

        if (handleApiError(error, "Tagesgeld laden")) return;
        if (data) setListeTagesgeld(data)


        console.log("Daten geladen:", data); // Debugging-Ausgabe

        if (handleApiError(error, "Transaktionen öffnen")) return;
        if (data) setListeTransaktionenTagesgeld(data)

        if (data && data.length > 0) {


            const notifyInfo = data.map(info => {
                const werte = Array.isArray(info.asset?.asset_name)
                    ? info.asset.asset_name[0]
                    : info.asset?.asset_name;


                const transaktionen = info.asset?.transaktionsprotokoll || [];

                const aktuellerKontostand = transaktionen.reduce((acc, t) => {
                    const betrag = Number(t.betrag || 0);
                    return t.typ === 'einnahme' ? acc + betrag : acc - betrag;
                }, 0);


                const zinssatz = Number(info.zinssatz || 0);
                const sparziel = Number(info.sparziel || 0);
                const sparrate = Number(info.sparrate || 0);

                const monatlicherZinssatz = (zinssatz / 100) * 12;

                const differenz = (sparziel - aktuellerKontostand) * monatlicherZinssatz;

                const aktuellerWert = sparrate + aktuellerKontostand * monatlicherZinssatz;



                let zielwert = "Unerreichbar";

                if (aktuellerKontostand >= sparziel) {
                    zielwert = 0;
                } else if (monatlicherZinssatz > 0 && aktuellerWert > 0) {
                    const oben = Math.log(1 + (differenz / aktuellerWert));
                    const unten = Math.log(1 + monatlicherZinssatz);
                    zielwert = oben / unten;
                } else if (sparrate > 0) {
                    zielwert = (sparziel - aktuellerKontostand) / sparrate;
                }

                return {
                    assetName: werte || "Unbekannt",
                    zielwert: isFinite(zielwert) && zielwert >= 0 ? Math.ceil(zielwert) : "Unerreichbar",
                };

            });


            // Toast-Benachrichtigung anzeigen
            toast.info(
                <div>
                    <p style={{ fontWeight: "bold", margin: "0 0 8px 0" }}>Verbleibende Sparzeit:</p>
                    {notifyInfo.map((info, index) => (
                        <div key={index}>
                            {info.assetName}: {typeof info.zielwert === "number" ? `${info.zielwert} ${info.zielwert === 1 ? "Monat" : "Monate"}` : info.zielwert}
                        </div>
                    ))}
                </div>
            );
        }
    };




    const ladeTagesgeld = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
            .from("tagesgeldkonto")
            .select(`*, 
                asset!inner(
                    benutzer_id,
                    asset_name,
                    asset_id,
                    transaktionsprotokoll(betrag, typ)
                )
            `)
            .eq("asset.benutzer_id", user.id)
            .order('asset_name', { referencedTable: 'asset', ascending: true });

        if (handleApiError(error, "Tagesgeld laden")) return;
        if (data) setListeTagesgeld(data)


        if (handleApiError(error, "Transaktionen öffnen")) return;
        if (data) setListeTransaktionenTagesgeld(data)
    }

    const ladeAssets = async () => {
        const { data } = await supabase
            .from("asset")
            .select("*")
            .order("asset_name", { ascending: true });

        if (data) setAssets(data);
    };

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
        if (data) setListeTransaktionenTagesgeld(data)
    }


    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) newErrors.name = "Asset Name ist erforderlich";
        if (!bank.trim()) newErrors.bank = "Bank Name ist erforderlich";
        if (!iban.trim()) newErrors.iban = "IBAN ist erforderlich";
        if (!waehrung.trim()) newErrors.waehrung = "Währung ist erforderlich";
        if (!eroeffnungsdatum) newErrors.eroeffnungsdatum = "Eröffnungsdatum ist erforderlich";
        if (!sparziel.trim()) newErrors.sparziel = "Sparziel ist erforderlich";
        if (!sparziel.trim()) newErrors.sparrate = "Sparrate ist erforderlich";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // true, wenn keine Fehler vorhanden
    };

    const handleTagesgeldkontoSpeichern = () => {
        if (validateForm()) {

            if (zuBearbeiten) {
                tagesgeldkontoSpeichern();
                setErrors({});
            }
            else {
                tagesgeldkontoHinzufuegen();
                setErrors({});
            }

        }
    };

    const tagesgeldkontoHinzufuegen = async () => {
        if (!name || !bank || !iban || !eroeffnungsdatum || !sparziel || !sparrate) return

        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { data: assetData, error: assetError } = await supabase
                .from("asset")
                .insert({
                    benutzer_id: user.id,
                    asset_name: name,
                    asset_typ: "tagesgeldkonto",
                })
                .select()

            if (assetError || !assetData || assetData.length === 0) {
                console.error("Fehler beim Erstellen des Assets:", assetError.message || JSON.stringify(assetError))
                alert("Fehler beim Erstellen des übergeordneten Assets.")
                return
            }

            const asset_id = assetData[0].asset_id

            const { error: tagesgeldkontoError } = await supabase
                .from("tagesgeldkonto")
                .insert({
                    benutzer_id: user.id,
                    asset_id: asset_id,
                    name_der_bank: bank,
                    iban: iban,
                    waehrung: waehrung || "EUR",
                    zinssatz: parseFloat(zinssatz) || 0,
                    zinsintervall: zinssintervall || "monatlich",
                    referenzkonto: ausgewaehltesReferenzkonto,
                    freistellungsauftrag: freistellungsauftrag || 0,
                    aktionszins: parseFloat(aktionszins) || 0,
                    ablaufdatum_aktionszins: ablaufdatum_aktionszins || null,
                    notgroschen: notgroschen || false,
                    einlagensicherung: parseFloat(einlagensicherung) || 100000,
                    sparrate: parseFloat(sparrate),
                    sparziel: parseFloat(sparziel),
                    mindestbetrag: parseFloat(mindestbetrag) || 0,
                    ist_aktiv: true,
                    notizen: transaktionsNotizen || "",
                    eroeffnungsdatum: eroeffnungsdatum,
                    kontoinhaber: kontoinhaber || "",
                    bic: bic || 0,
                    einzahlung_bei_eroeffnung: parseFloat(einzahlung_bei_eroeffnung) || 0,
                    ist_referenzkonto: ist_referenzkonto || false
                })

            if (tagesgeldkontoError) {
                console.error("Fehler beim Erstellen des Tagesgeldkontos:", tagesgeldkontoError)
                alert("Fehler beim Tagesgeldkonto-Insert.")
                return
            }

            const { error: transError } = await supabase
                .from("transaktionsprotokoll")
                .insert({
                    benutzer_id: user.id,
                    notizen: "Einzahlung bei Eröffnung",
                    betrag: parseFloat(einzahlung_bei_eroeffnung) || 0,
                    kategorie_id: 'd5473c35-2e52-41ef-82a2-3eef5aff038f',
                    asset_id: asset_id,
                    assetklasse: "tagesgeldkonto",
                    typ: "einnahme"
                })

            if (transError) {
                console.error("Fehler beim Erstellen der Transaktion Eroeffnung:", transError)
                alert("Fehler beim Tagesgeldkonto-Insert.")
                return
            }

            setName("")
            setBank("")
            setIban("")
            setEinzahlung_bei_eroeffnung("")
            setWaehrung("EUR")
            setEroeffnungsdatum("")
            setTransaktionsNotizen("")
            setKontoinhaber("")
            setIstAktiv(true)
            setBic("")
            setZinssatz("")
            setModalOffenHinzu(false)

            ladeTagesgeld()
        } catch (err) {
            console.error("Unerwarteter Fehler:", err)
        }
    }

    const bearbeitenOeffnen = (eintrag) => {
        setZuBearbeiten(eintrag)
        setName(eintrag.asset?.asset_name || "")
        setBank(eintrag.name_der_bank || "")
        setIban(eintrag.iban || "")
        setEinzahlung_bei_eroeffnung(eintrag.einzahlung_bei_eroeffnung || "")
        setWaehrung(eintrag.waehrung || "EUR")
        setZinssatz(eintrag.zinssatz || "")
        setZinssintervall(eintrag.zinsintervall || "monatlich")
        setAusgewaehltesReferenzkonto(eintrag.referenzkonto || "")
        setFreistellungsauftrag(eintrag.freistellungsauftrag || "")
        setAktionszins(eintrag.aktionszins || "")
        setAblaufdatum_aktionszins(eintrag.ablaufdatum_aktionszins || "")
        setNotgroschen(eintrag.notgroschen || false)
        setEinlagensicherung(eintrag.einlagensicherung || "")
        setSparrate(eintrag.sparrate || "")
        setSparziel(eintrag.sparziel || "")
        setMindestbetrag(eintrag.mindestbetrag || "")
        setEroeffnungsdatum(eintrag.eroeffnungsdatum || "")
        setTransaktionsNotizen(eintrag.notizen || "")
        setKontoinhaber(eintrag.kontoinhaber || "")
        setIstAktiv(eintrag.ist_aktiv ?? true)
        setBic(eintrag.bic || "")
        setIstReferenzkonto(eintrag.ist_referenzkonto || false)
        setModalOffen(true)
    }

    const assetLoeschenMitLog = async (assetId, assetTyp, tabelleName) => {
        if (!assetId) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data: werte, error: tlogError } = await supabase
                .from("transaktionsprotokoll")
                .select("*")
                .eq("asset_id", assetId)

            if (handleApiError(tlogError, "Asset vor dem Löschen abrufen")) return;

            const { error: ttlogError } = await supabase
                .from("geloeschte_transaktionen_log")
                .insert({
                    benutzer_id: user.id,
                    asset_id: assetId,
                    asset_typ: assetTyp, // z.B. "tagesgeldkonto"
                    daten: werte,
                });

            if (handleApiError(ttlogError, "Globale Log-Tabelle befüllen")) return;

            const { error: tDeleteError } = await supabase
                .from("transaktionsprotokoll")
                .delete()
                .eq("asset_id", assetId);

            if (handleApiError(tDeleteError, `${assetTyp} löschen`)) return;

            // 1. Daten des spezifischen Assets laden (egal aus welcher Tabelle)
            const { data: eintrag, error: fetchError } = await supabase
                .from(tabelleName)
                .select("*")
                .eq("asset_id", assetId)
                .single();

            if (handleApiError(fetchError, "Asset vor dem Löschen abrufen")) return;

            // 2. In die GLOBALE Log-Tabelle schreiben
            const { error: logError } = await supabase
                .from("geloeschte_assets_log")
                .insert({
                    benutzer_id: user.id,
                    asset_id: assetId,
                    asset_typ: assetTyp, // z.B. "tagesgeldkonto"
                    asset_name: eintrag?.name || eintrag?.name_der_bank || "Unbenannt",
                    daten: eintrag,      // Speichert alle spezifischen Spalten als JSON
                });

            if (handleApiError(logError, "Globale Log-Tabelle befüllen")) return;

            // 3. Aus der spezifischen Tabelle löschen
            const { error: subDeleteError } = await supabase
                .from(tabelleName)
                .delete()
                .eq("asset_id", assetId);

            if (handleApiError(subDeleteError, `${assetTyp} löschen`)) return;

            // 4. Aus der übergeordneten Asset-Haupttabelle löschen
            const { error: mainDeleteError } = await supabase
                .from("asset")
                .delete()
                .eq("asset_id", assetId);

            if (handleApiError(mainDeleteError, "Asset Haupteintrag löschen")) return;



        } catch (err) {
            console.error("Unerwarteter Fehler beim Löschen:", err);
        }

        ladeTagesgeld()
    };

    const tagesgeldkontoSpeichern = async () => {

        if (!name || !bank || !iban || !eroeffnungsdatum || !sparrate || !sparziel) {
            alert("Bitte fülle alle Pflichtfelder (Asset Name, Bank Name, IBAN, Eröffnungsdatum) aus!");
            return;
        }

        if (!zuBearbeiten) return;

        const { error: assetError } = await supabase
            .from("asset")
            .update({ asset_name: name })
            .eq("asset_id", zuBearbeiten.asset_id);

        if (handleApiError(assetError, "Asset Name updaten")) return;

        const { error: tagesgeldkontoError } = await supabase
            .from("tagesgeldkonto")
            .update({
                name_der_bank: bank,
                iban: iban,
                waehrung: waehrung,
                zinssatz: parseFloat(zinssatz) || 0,
                zinsintervall: zinssintervall || "monatlich",
                referenzkonto: referenzkonto,
                freistellungsauftrag: freistellungsauftrag || "1000",
                aktionszins: parseFloat(aktionszins) || 0,
                ablaufdatum_aktionszins: ablaufdatum_aktionszins || null,
                notgroschen: notgroschen || false,
                einlagensicherung: parseFloat(einlagensicherung) || 100000,
                sparrate: parseFloat(sparrate),
                sparziel: parseFloat(sparziel),
                mindestbetrag: parseFloat(mindestbetrag) || 0,
                ist_aktiv: ist_aktiv,
                notizen: transaktionsNotizen || "",
                eroeffnungsdatum: eroeffnungsdatum,
                kontoinhaber: kontoinhaber || "",
                bic: bic,
                einzahlung_bei_eroeffnung: parseFloat(einzahlung_bei_eroeffnung) || 0,
                ist_referenzkonto: ist_referenzkonto || false
            })
            .eq("asset_id", zuBearbeiten.asset_id);

        if (handleApiError(tagesgeldkontoError, "Tagesgeldkontodaten updaten")) return;

        setModalOffen(false)
        setZuBearbeiten(null)
        ladeTagesgeld()
    }

    const transaktionHinzufuegen = async () => {
        if (!transaktionsNotizen || !transaktionsBetrag || !transaktionsKategorie || !transaktionsTyp) return;
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from("transaktionsprotokoll").insert({
            benutzer_id: user.id,
            notizen: transaktionsNotizen,
            betrag: parseFloat(transaktionsBetrag),
            kategorie_id: transaktionsKategorie,
            asset_id: ausgewaehltesAsset,
            assetklasse: "tagesgeldkonto",
            typ: transaktionsTyp
        });

        if (handleApiError(error, "Transaktion hinzufügen")) return;

        setTransaktionsNotizen("");
        setTransaktionsBetrag("");
        setTransaktionsKategorie("");
        setTransaktionsTyp("");

        ladeTagesgeld();
        transaktionenOeffnen(ausgewaehltesAsset);
        setModalTranskationenHinzufuegen(false);
    };

    const ladeKategorien = async () => {
        const { data, error } = await supabase
            .from("transaktionskategorie")
            .select("*")
            .eq("sichtbar", true)
            .order("name", { ascending: true });


        if (data) setKategorien(data);
        if (handleApiError(error, "Kategorie laden")) return;
    };

    const ladeReferenzkonto = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from("asset")
            .select(`*,
            tagesgeldkonto!left(*),
            girokonto!left(*)`)
            .eq("benutzer_id", user.id)
            .eq("tagesgeldkonto.ist_referenzkonto", true)
            .eq("girokonto.ist_referenzkonto", true)
            .order('asset_name', { ascending: true });

        if (data) {
            const aktiveReferenzkonten = data
                .map(asset => {
                    // Sicherstellen, dass wir immer das erste Objekt aus dem Array holen (falls Array vorhanden)
                    const tagesgeld = Array.isArray(asset.tagesgeldkonto)
                        ? asset.tagesgeldkonto[0]
                        : asset.tagesgeldkonto;

                    const girokonto = Array.isArray(asset.girokonto)
                        ? asset.girokonto[0]
                        : asset.girokonto;

                    return {
                        ...asset,
                        tagesgeldkonto: tagesgeld || null,
                        girokonto: girokonto || null
                    };
                })
                .filter(asset => {
                    // Das Optional Chaining ?. verhindert den "Cannot read properties of undefined" Fehler!
                    const istTagesgeldAktiv = asset.tagesgeldkonto?.ist_aktiv === true;
                    const istGiroAktiv = asset.girokonto?.ist_aktiv === true;

                    return istTagesgeldAktiv || istGiroAktiv;
                });

            setListeReferenzkonto(aktiveReferenzkonten);
        }

        if (handleApiError(error, "Referenzkonto laden")) return;
    };

    useEffect(() => {
        const init = async () => {
            try {
                await ladeTagesgeld()
                await ladeKategorien();
                await ladeReferenzkonto();
                await ladeAssets();
                await berechneZiel();
            } catch (err) {
                console.error("Fehler in init:", err);
            }
        };
        init();
    }, []);

    return (
        <div className="tagesgeldkonto-container">
            <div className="header-bar">
                <h2>Tagesgeld</h2>
                <button className="btn-primary" onClick={() => {
                    setModalOffenHinzu(true, ladeReferenzkonto());
                    setZuBearbeiten(null);
                    setName(""); setBank(""); setIban(""); setEinzahlung_bei_eroeffnung("");
                    setWaehrung("EUR"); setEroeffnungsdatum(""); setTransaktionsNotizen("");
                    setKontoinhaber(""); setIstAktiv(true); setBic(""); setZinssatz("");
                    setZinssintervall("monatlich"); setAusgewaehltesReferenzkonto(""); setFreistellungsauftrag("");
                    setAktionszins(""); setAblaufdatum_aktionszins(""); setNotgroschen(false);
                    setEinlagensicherung("100000"); setSparrate(""); setSparziel(""); setMindestbetrag(""); setIstReferenzkonto(false);
                }}>
                    + Tagesgeldkonto hinzufügen
                </button>
            </div>

            {ansicht === 'card' ? (
                <div className="karten-grid">
                    {listeTagesgeld.map((e) => {
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
                                    {e.notgroschen && <span className="badge">Notgroschen</span>}
                                    {e.ist_referenzkonto && <span className="badge">Referenzkonto</span>}
                                </div>

                                <div className="card-body">


                                    <div className="amount">
                                        <strong>{aktuellerKontostand.toFixed(2)} {e.waehrung}</strong>
                                    </div>


                                    <div className="amount">

                                        {e.einzahlung_bei_eroeffnung} {e.waehrung}
                                    </div>
                                    <p className="iban"><strong>IBAN:</strong> {e.iban}</p>
                                    {e.notizen && <p className="note">{e.notizen}</p>}
                                </div>

                                <div className="card-actions">
                                    <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                                    <button onClick={() => assetLoeschenMitLog(e.asset?.asset_id, "tagesgeldkonto", "tagesgeldkonto")} title="Löschen">🗑️</button>
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
                                <th>IBAN</th>
                                <th>Guthaben</th>
                                <th>Inhaber</th>
                                <th>Referenzkonto</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listeTagesgeld.map((e) => {

                                const transaktionen = e.asset?.transaktionsprotokoll || [];
                                const summe = transaktionen.reduce((acc, t) => {
                                    const betrag = Number(t.betrag || 0);
                                    return t.typ === 'einnahme' ? acc + betrag : acc - betrag;
                                }, 0);
                                const aktuellerKontostand = summe;

                                return (
                                    <tr key={e.id}>
                                        <td>
                                            <strong>{e.asset?.asset_name}</strong>
                                            <div className="subtext">{e.name_der_bank}</div>
                                        </td>
                                        <td className="code-text">{e.iban}</td>
                                        <td><strong>{aktuellerKontostand.toFixed(2)} {e.waehrung}</strong></td>
                                        <td>{e.kontoinhaber || "—"}</td>
                                        <td>{referenzkonto}</td>
                                        <td className="table-actions">
                                            <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
                                            <button onClick={() => assetLoeschenMitLog(e.asset?.asset_id, "tagesgeldkonto", "tagesgeldkonto")}>🗑️</button>
                                            <button onClick={() => transaktionenOeffnen(e.asset?.asset_id)}>💰</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL: Transaktionsübersicht */}
            {modalOffenTransaktionen && (
                <div className="modal-overlay">
                    <div className="modal-container modal-lg">
                        <div className="modal-header">
                            <h3>Transaktionsübersicht</h3>
                            <button className="close-btn" onClick={() => setModalOffenTransaktionen(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {listeTransaktionenTagesgeld.length === 0 ? (
                                <p className="empty-text">Keine Transaktionen für dieses Konto vorhanden.</p>
                            ) : (
                                <ul className="transaction-list">
                                    {listeTransaktionenTagesgeld.map((t) => (
                                        <li key={t.id} className="transaction-item">
                                            <div className="tx-info">
                                                <span className="tx-desc">{t.notizen || "Ohne Notizen"}</span>
                                                <span className="tx-date">{t.datum}</span>
                                            </div>
                                            <span className={`tx-amount ${t.typ === 'einnahme' ? 'positive' : 'negative'}`}>
                                                {t.typ === 'einnahme' ? '+' : '-'}{t.betrag} {t.waehrung || 'EUR'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setModalOffenTransaktionen(false)}>Schließen</button>
                            <button className="btn-primary" onClick={() => setModalTranskationenHinzufuegen(true)}>+ Transaktion hinzufügen</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Hinzufügen */}
            {modalOffenHinzu && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>Neues Tagesgeldkonto hinzufügen</h3>
                            <button className="close-btn" onClick={() => setModalOffenHinzu(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Asset Name*</label>
                                    <input
                                        className={errors.name ? "input-error" : ""}
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: null }); }}
                                        placeholder="z.B. Hauptkonto"
                                    />
                                    {errors.name && <span className="error-text">{errors.name}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Bank Name*</label>
                                    <input
                                        className={errors.bank ? "input-error" : ""}
                                        value={bank}
                                        onChange={(e) => { setBank(e.target.value); setErrors({ ...errors, bank: null }); }}
                                        placeholder="z.B. Sparkasse"
                                    />
                                    {errors.bank && <span className="error-text">{errors.bank}</span>}
                                </div>
                                <div className="form-group col-span-2">
                                    <label>IBAN*</label>
                                    <input
                                        className={errors.iban ? "input-error" : ""}
                                        value={iban}
                                        onChange={(e) => { setIban(e.target.value); setErrors({ ...errors, iban: null }); }}
                                        placeholder="DE00 0000 0000 0000 0000 00"
                                    />
                                    {errors.iban && <span className="error-text">{errors.iban}</span>}
                                </div>
                                <div className="form-group">
                                    <label>BIC</label>
                                    <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BIC Code" />
                                </div>
                                <div className="form-group">
                                    <label>Kontoinhaber</label>
                                    <input value={kontoinhaber} onChange={(e) => setKontoinhaber(e.target.value)} placeholder="Max Mustermann" />
                                </div>
                                <div className="form-group">
                                    <label>Startguthaben</label>
                                    <input value={einzahlung_bei_eroeffnung} onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} placeholder="0.00" type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Währung*</label>
                                    <input
                                        className={errors.waehrung ? "input-error" : ""}
                                        value={waehrung}
                                        onChange={(e) => { setWaehrung(e.target.value); setErrors({ ...errors, waehrung: null }); }}
                                        placeholder="EUR"
                                    />
                                    {errors.waehrung && <span className="error-text">{errors.waehrung}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Eröffnungsdatum*</label>
                                    <input
                                        className={errors.eroeffnungsdatum ? "input-error" : ""}
                                        type="date"
                                        value={eroeffnungsdatum}
                                        onChange={(e) => { setEroeffnungsdatum(e.target.value); setErrors({ ...errors, eroeffnungsdatum: null }); }}
                                    />
                                    {errors.eroeffnungsdatum && <span className="error-text">{errors.eroeffnungsdatum}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Zinssatz (% p.a.)</label>
                                    <input value={zinssatz} onChange={(e) => setZinssatz(e.target.value)} placeholder="3.25" type="number" step="0.01" />
                                </div>
                                <div className="form-group">
                                    <label>Zinsintervall</label>
                                    <select value={zinssintervall} onChange={(e) => setZinssintervall(e.target.value)}>
                                        <option value="monatlich">Monatlich</option>
                                        <option value="quartalsweise">Quartalsweise</option>
                                        <option value="jaehrlich">Jährlich</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Aktionszins (%)</label>
                                    <input value={aktionszins} onChange={(e) => setAktionszins(e.target.value)} placeholder="3.75" type="number" step="0.01" />
                                </div>
                                <div className="form-group">
                                    <label>Ablaufdatum Aktionszins</label>
                                    <input type="date" value={ablaufdatum_aktionszins} onChange={(e) => setAblaufdatum_aktionszins(e.target.value)} />
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Referenzkonto / Auszahlungskonto</label>
                                    <select value={ausgewaehltesReferenzkonto} onChange={(e) => setAusgewaehltesReferenzkonto(e.target.value)}>
                                        <option value="">Kein Referenzkonto (Optional)</option>
                                        {listeReferenzkonto.map(konto => (
                                            <option key={konto.id} value={konto.id}>
                                                {konto.girokonto
                                                    ? `Girokonto (${konto.girokonto.iban || ''})`
                                                    : `Tagesgeld (${konto.tagesgeldkonto?.iban || konto.asset_name || ''})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Sparziel (€)</label>
                                    <input
                                        className={errors.sparziel ? "input-error" : ""}
                                        value={sparziel}
                                        onChange={(e) => { setSparziel(e.target.value); setErrors({ ...errors, sparziel: null }); }}
                                        placeholder="100.00 €"
                                    />
                                    {errors.sparziel && <span className="error-text">{errors.sparziel}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Sparrate (€/Monat)</label>
                                    <input
                                        className={errors.sparrate ? "input-error" : ""}
                                        value={sparrate}
                                        onChange={(e) => { setSparrate(e.target.value); setErrors({ ...errors, sparrate: null }); }}
                                        placeholder="200.00 €"
                                    />
                                    {errors.sparrate && <span className="error-text">{errors.sparrate}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Mindestbetrag (€)</label>
                                    <input value={mindestbetrag} onChange={(e) => setMindestbetrag(e.target.value)} placeholder="0.00" type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Einlagensicherung (€)</label>
                                    <input value={einlagensicherung} onChange={(e) => setEinlagensicherung(e.target.value)} placeholder="100000" type="number" />
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Notizen</label>
                                    <input value={transaktionsNotizen} onChange={(e) => setTransaktionsNotizen(e.target.value)} placeholder="Optionale Notiz..." />
                                </div>
                                <div className="form-group">
                                    <label>Freistellingsauftrag</label>
                                    <input value={freistellungsauftrag} onChange={(e) => setFreistellungsauftrag(e.target.value)} placeholder="1000" />
                                </div>

                                <div className="form-group checkbox-group col-span-2">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={notgroschen} onChange={(e) => setNotgroschen(e.target.checked)} />
                                        Als Notgroschen festlegen
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={ist_referenzkonto} onChange={(e) => setIstReferenzkonto(e.target.checked)} />
                                        Als Referenzkonto festlegen
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setModalOffenHinzu(false)}>Abbrechen</button>
                            <button className="btn-primary" onClick={handleTagesgeldkontoSpeichern}>Speichern</button>
                        </div>
                    </div>
                </div>
            )}


            {/* MODAL: Bearbeiten */}
            {modalOffen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>Neues Tagesgeldkonto hinzufügen</h3>
                            <button className="close-btn" onClick={() => setModalOffenHinzu(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Asset Name*</label>
                                    <input
                                        className={errors.name ? "input-error" : ""}
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: null }); }}
                                        placeholder="z.B. Hauptkonto"
                                    />
                                    {errors.name && <span className="error-text">{errors.name}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Bank Name*</label>
                                    <input
                                        className={errors.bank ? "input-error" : ""}
                                        value={bank}
                                        onChange={(e) => { setBank(e.target.value); setErrors({ ...errors, bank: null }); }}
                                        placeholder="z.B. Sparkasse"
                                    />
                                    {errors.bank && <span className="error-text">{errors.bank}</span>}
                                </div>
                                <div className="form-group col-span-2">
                                    <label>IBAN*</label>
                                    <input
                                        className={errors.iban ? "input-error" : ""}
                                        value={iban}
                                        onChange={(e) => { setIban(e.target.value); setErrors({ ...errors, iban: null }); }}
                                        placeholder="DE00 0000 0000 0000 0000 00"
                                    />
                                    {errors.iban && <span className="error-text">{errors.iban}</span>}
                                </div>
                                <div className="form-group">
                                    <label>BIC</label>
                                    <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BIC Code" />
                                </div>
                                <div className="form-group">
                                    <label>Kontoinhaber</label>
                                    <input value={kontoinhaber} onChange={(e) => setKontoinhaber(e.target.value)} placeholder="Max Mustermann" />
                                </div>
                                <div className="form-group">
                                    <label>Startguthaben</label>
                                    <input value={einzahlung_bei_eroeffnung} onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} placeholder="0.00" type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Währung*</label>
                                    <input
                                        className={errors.waehrung ? "input-error" : ""}
                                        value={waehrung}
                                        onChange={(e) => { setWaehrung(e.target.value); setErrors({ ...errors, waehrung: null }); }}
                                        placeholder="EUR"
                                    />
                                    {errors.waehrung && <span className="error-text">{errors.waehrung}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Eröffnungsdatum*</label>
                                    <input
                                        className={errors.eroeffnungsdatum ? "input-error" : ""}
                                        type="date"
                                        value={eroeffnungsdatum}
                                        onChange={(e) => { setEroeffnungsdatum(e.target.value); setErrors({ ...errors, eroeffnungsdatum: null }); }}
                                    />
                                    {errors.eroeffnungsdatum && <span className="error-text">{errors.eroeffnungsdatum}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Zinssatz (% p.a.)</label>
                                    <input value={zinssatz} onChange={(e) => setZinssatz(e.target.value)} placeholder="3.25" type="number" step="0.01" />
                                </div>
                                <div className="form-group">
                                    <label>Zinsintervall</label>
                                    <select value={zinssintervall} onChange={(e) => setZinssintervall(e.target.value)}>
                                        <option value="monatlich">Monatlich</option>
                                        <option value="quartalsweise">Quartalsweise</option>
                                        <option value="jaehrlich">Jährlich</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Aktionszins (%)</label>
                                    <input value={aktionszins} onChange={(e) => setAktionszins(e.target.value)} placeholder="3.75" type="number" step="0.01" />
                                </div>
                                <div className="form-group">
                                    <label>Ablaufdatum Aktionszins</label>
                                    <input type="date" value={ablaufdatum_aktionszins} onChange={(e) => setAblaufdatum_aktionszins(e.target.value)} />
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Referenzkonto / Auszahlungskonto</label>
                                    <select value={ausgewaehltesReferenzkonto} onChange={(e) => setAusgewaehltesReferenzkonto(e.target.value)}>
                                        <option value="">Kein Referenzkonto (Optional)</option>
                                        {listeReferenzkonto.map(konto => (
                                            <option key={konto.id} value={konto.id}>
                                                {konto.girokonto
                                                    ? `Girokonto (${konto.girokonto.iban || ''})`
                                                    : `Tagesgeld (${konto.tagesgeldkonto?.iban || konto.asset_name || ''})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Sparziel (€)</label>
                                    <input
                                        className={errors.sparziel ? "input-error" : ""}
                                        value={sparziel}
                                        onChange={(e) => { setSparziel(e.target.value); setErrors({ ...errors, sparziel: null }); }}
                                        placeholder="100.00 €"
                                    />
                                    {errors.sparziel && <span className="error-text">{errors.sparziel}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Sparrate (€/Monat)</label>
                                    <input
                                        className={errors.sparrate ? "input-error" : ""}
                                        value={sparrate}
                                        onChange={(e) => { setSparrate(e.target.value); setErrors({ ...errors, sparrate: null }); }}
                                        placeholder="200.00 €"
                                    />
                                    {errors.sparrate && <span className="error-text">{errors.sparrate}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Mindestbetrag (€)</label>
                                    <input value={mindestbetrag} onChange={(e) => setMindestbetrag(e.target.value)} placeholder="0.00" type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Einlagensicherung (€)</label>
                                    <input value={einlagensicherung} onChange={(e) => setEinlagensicherung(e.target.value)} placeholder="100000" type="number" />
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Notizen</label>
                                    <input value={transaktionsNotizen} onChange={(e) => setTransaktionsNotizen(e.target.value)} placeholder="Optionale Notiz..." />
                                </div>
                                <div className="form-group">
                                    <label>Freistellingsauftrag</label>
                                    <input value={freistellungsauftrag} onChange={(e) => setFreistellungsauftrag(e.target.value)} placeholder="1000" />
                                </div>

                                <div className="form-group checkbox-group col-span-2">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={ist_aktiv} onChange={(e) => setIstAktiv(e.target.checked)} />
                                        Konto ist Aktiv
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={notgroschen} onChange={(e) => setNotgroschen(e.target.checked)} />
                                        Als Notgroschen festlegen
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={ist_referenzkonto} onChange={(e) => setIstReferenzkonto(e.target.checked)} />
                                        Als Referenzkonto festlegen
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setModalOffen(false)}>Abbrechen</button>
                            <button className="btn-primary" onClick={handleTagesgeldkontoSpeichern}>Speichern</button>
                        </div>
                    </div>
                </div>
            )}
            {modalTranskationenHinzufuegen && (
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
                            value={transaktionsNotizen}
                            onChange={(e) => setTransaktionsNotizen(e.target.value)}
                            placeholder="Notizen"
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
                        <select
                            value={ausgewaehltesAsset}
                            onChange={(e) => setAusgewaehltesAsset(e.target.value)}
                            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                        >
                            <option value="">Asset wählen</option>
                            {assets.map((a) => (
                                <option key={a.asset_id} value={a.asset_id}>
                                    {a.asset_typ} | {a.asset_name}
                                </option>
                            ))}
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
                                onClick={() => setModalTranskationenHinzufuegen(false)}
                                style={{ flex: 1, padding: "10px", backgroundColor: "#e2e8f0", color: "#475569", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer />
        </div>
    );
}