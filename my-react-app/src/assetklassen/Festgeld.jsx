import { useEffect, useState, useContext, use } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import { SettingsContext } from '../SettingsContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { data } from "react-router-dom";

export default function Festgeld() {
    const [ablaufdatum_aktionszins, setAblaufdatum_aktionszins] = useState("")
    const [aktionszins, setAktionszins] = useState("")
    const [anlagesumme, setAnlagesumme] = useState("")
    const [assets, setAssets] = useState([])
    const [ausgewaehltesAsset, setAusgewaehltesAsset] = useState("")
    const [ausgewaehltesReferenzkonto, setAusgewaehltesReferenzkonto] = useState("")
    const [automatischVerlaengern, setAutomatischVerlaengern] = useState("")
    const [bank, setBank] = useState("")
    const [bic, setBic] = useState("")
    const [einlagensicherung, setEinlagensicherung] = useState("")
    const [einzahlung_bei_eroeffnung, setEinzahlung_bei_eroeffnung] = useState("")
    const [eroeffnungsdatum, setEroeffnungsdatum] = useState("")
    const [errors, setErrors] = useState({})
    const [freistellungsauftrag, setFreistellungsauftrag] = useState("")
    const [faelligkeitsdatum, setFaelligkeitsdatum] = useState("")
    const [gekuendigtAm, setGekuendigtAm] = useState("")
    const [iban, setIban] = useState("")
    const [ist_aktiv, setIstAktiv] = useState(true)
    const [intervall, setIntervall] = useState("");
    const [kategorien, setKategorien] = useState([])
    const [kontoinhaber, setKontoinhaber] = useState("")
    const [kuendigungsfrist, setKuendigungsfrist] = useState("")
    const [laufzeitMonate, setLaufzeitMonate] = useState("")
    const [letzterKuendigungstag, setLetzerKuendigungstag] = useState("")
    const [listeFestgeld, setListeFestgeld] = useState([])
    const [listeReferenzkonto, setListeReferenzkonto] = useState([])
    const [listeTransaktionenFestgeld, setListeTransaktionenFestgeld] = useState([])
    const [modalOffen, setModalOffen] = useState(false)
    const [modalOffenHinzu, setModalOffenHinzu] = useState(false)
    const [modalOffenTransaktionen, setModalOffenTransaktionen] = useState(false)
    const [modalTranskationenHinzufuegen, setModalTranskationenHinzufuegen] = useState(false)
    const [name, setName] = useState("")
    const [notizen, setNotizen] = useState("")
    const [referenzkonto, setReferenzkonto] = useState("")
    const [steuersatzAbzug, setSteuerssatzAbzug] = useState("")
    const [transaktionsBetrag, setTransaktionsBetrag] = useState("")
    const [transaktionsKategorie, setTransaktionsKategorie] = useState("")
    const [transaktionsNotizen, setTransaktionsNotizen] = useState("")
    const [transaktionsTyp, setTransaktionsTyp] = useState("")
    const [waehrung, setWaehrung] = useState("EUR")
    const [wiederkehrendaktiv, setWiederkehrendaktiv] = useState(false);
    const [zuBearbeiten, setZuBearbeiten] = useState(null)
    const [zinsgutschrift, setZinsgutschrift] = useState("")
    const [zinssatz, setZinssatz] = useState("")
    const [zinseszins, setZinseszins] = useState("")

    const { ansicht } = useContext(SettingsContext);


    const ladeFestgeld = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
            .from("festgeld")
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

        if (handleApiError(error, "Festgeld laden")) return;
        if (data) setListeFestgeld(data)


        if (handleApiError(error, "Transaktionen öffnen")) return;
        if (data) setListeTransaktionenFestgeld(data)
    }

    const ladeAssets = async () => {
        const { data } = await supabase
            .from("asset")
            .select("*")
            .order("asset_name", { ascending: true });

        if (data) setAssets(data);
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

    const validateForm = () => {
        const newErrors = {};

        // String-Felder mit String()-Absicherung gegen Nicht-Strings
        if (!name || !String(name).trim()) newErrors.name = "Asset Name ist erforderlich";
        if (!bank || !String(bank).trim()) newErrors.bank = "Bank Name ist erforderlich";
        if (!anlagesumme || !String(anlagesumme).trim()) newErrors.anlagesumme = "Anlagesumme ist erforderlich";
        if (!zinssatz || !String(zinssatz).trim()) newErrors.zinssatz = "Zinssatz ist erforderlich";
        if (!laufzeitMonate || !String(laufzeitMonate).trim()) newErrors.laufzeitMonate = "Laufzeit ist erforderlich";

        // Datum-Felder
        if (!eroeffnungsdatum) newErrors.anlagedatum = "Anlagedatum ist erforderlich";
        if (!faelligkeitsdatum) newErrors.faelligkeitsdatum = "Fälligkeitsdatum ist erforderlich";

        // Dropdown/Select
        if (!ausgewaehltesReferenzkonto) newErrors.ausgewaehltesReferenzkonto = "Referenzkonto ist erforderlich";

        setErrors(newErrors);

        // Prüfen, ob das Fehler-Objekt leer ist
        return Object.keys(newErrors).length === 0;
    };

    const handleFestgeldSpeichern = () => {
        console.log("1. Button geklickt");
        console.log("Aktuelle States:", {
            name, bank, anlagesumme, zinssatz, laufzeitMonate,
            eroeffnungsdatum, faelligkeitsdatum, ausgewaehltesReferenzkonto, iban
        });

        const isValid = validateForm();
        console.log("2. Validierungsergebnis:", isValid);

        if (isValid) {
            if (zuBearbeiten) {
                festgeldSpeichern();
            } else {
                festgeldHinzufuegen();
            }
        } else {
            console.log("3. Validierungsfehler (errors):", errors);
        }
    };

    const festgeldHinzufuegen = async () => {

        console.log("Test2 - Prüfe Pflichtfelder...");

        if (!name || !bank || !anlagesumme || !zinssatz || !laufzeitMonate) {
            console.warn("Abgebrochen wegen fehlender Felder!", { name, bank, anlagesumme, zinssatz, laufzeitMonate });
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { data: assetData, error: assetError } = await supabase
                .from("asset")
                .insert({
                    benutzer_id: user.id,
                    asset_name: name,
                    asset_typ: "festgeld",
                })
                .select()

            if (assetError || !assetData || assetData.length === 0) {
                console.error("Fehler beim Erstellen des Assets:", assetError.message || JSON.stringify(assetError))
                alert("Fehler beim Erstellen des übergeordneten Assets.")
                return
            }

            const asset_id = assetData[0].asset_id

            const { error: festgeldError } = await supabase
                .from("festgeld")
                .insert({
                    benutzer_id: user.id,
                    asset_id: asset_id,
                    name_der_bank: bank,
                    anlagesumme: parseFloat(anlagesumme) || 0,
                    zinssatz: parseFloat(zinssatz) || 0,
                    laufzeit_monate: parseFloat(laufzeitMonate) || 0,
                    anlagedatum: eroeffnungsdatum,
                    faelligkeitsdatum: faelligkeitsdatum,
                    gekuendigt_am: gekuendigtAm || null,
                    zinsgutschrift: zinsgutschrift || "",
                    zinseszins: zinseszins || true,
                    freistellungsauftrag: freistellungsauftrag || 0,
                    steuersatz_abzug: steuersatzAbzug || 0,
                    referenzkonto: ausgewaehltesReferenzkonto,
                    automatische_verlaengerung: automatischVerlaengern || false,
                    ist_aktiv: ist_aktiv || true,
                    notizen: notizen || "",
                    iban: iban,
                    bic: bic || "",
                    kontoinhaber: kontoinhaber || ""
                })

            if (festgeldError) {
                console.error("Fehler beim Erstellen des Festgeldkontos:", festgeldError)
                alert("Fehler beim Festgeld-Insert.")
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
                    assetklasse: "festgeld",
                    typ: "einnahme"
                })

            if (transError) {
                console.error("Fehler beim Erstellen der Transaktion Eroeffnung:", transError)
                alert("Fehler beim Festgeld-Insert.")
                return
            }

            setName("")
            setBank("")
            setIban("")
            setEinzahlung_bei_eroeffnung("")
            setWaehrung("EUR")
            setEroeffnungsdatum("")
            setNotizen("")
            setKontoinhaber("")
            setIstAktiv(true)
            setBic("")
            setZinssatz("")
            setModalOffenHinzu(false)

            ladeFestgeld()
        } catch (err) {
            console.error("Unerwarteter Fehler:", err)
        }
    }

    const festgeldSpeichern = async () => {

        if (!name || !bank || !iban || !eroeffnungsdatum || !einzahlung_bei_eroeffnung || !zinssatz || !laufzeitMonate || !faelligkeitsdatum || !faelligkeitsdatum) {
            alert("Bitte fülle alle Pflichtfelder (Asset Name, Bank Name, IBAN, Eröffnungsdatum) aus!");
            return;
        }

        if (!zuBearbeiten) return;

        const { error: assetError } = await supabase
            .from("asset")
            .update({ asset_name: name })
            .eq("asset_id", zuBearbeiten.asset_id);

        if (handleApiError(assetError, "Asset Name updaten")) return;

        const { error: festgeldError } = await supabase
            .from("festgeld")
            .update({
                name_der_bank: bank,
                anlagesumme: anlagesumme,
                zinssatz: zinssatz,
                laufzeit_monate: laufzeitMonate,
                anlagedatum: eroeffnungsdatum,
                faelligkeitsdatum: faelligkeitsdatum,
                gekuendigt_am: gekuendigtAm || null,
                zinsgutschrift: zinsgutschrift,
                zinseszins: zinseszins || 0,
                freistellungsauftrag: freistellungsauftrag || 0,
                steuersatz_abzug: steuersatzAbzug || 0,
                referenzkonto: ausgewaehltesReferenzkonto,
                automatische_verlaengerung: automatischVerlaengern || false,
                ist_aktiv: ist_aktiv || true,
                notizen: notizen || "",
                iban: iban,
                bic: bic,
                kontoinhaber: kontoinhaber || ""
            })
            .eq("asset_id", zuBearbeiten.asset_id);

        if (handleApiError(festgeldError, "Festgeld updaten")) return;

        setModalOffen(false)
        setZuBearbeiten(null)
        ladeFestgeld()
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
            assetklasse: "festgeld",
            typ: transaktionsTyp
        });

        if (handleApiError(error, "Transaktion hinzufügen")) return;

        setTransaktionsNotizen("");
        setTransaktionsBetrag("");
        setTransaktionsKategorie("");
        setTransaktionsTyp("");

        ladeFestgeld();
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
        if (data) setListeTransaktionenFestgeld(data)
    }

    const bearbeitenOeffnen = (eintrag) => {
        setZuBearbeiten(eintrag);
        setName(eintrag.asset?.asset_name || "");
        setBank(eintrag.name_der_bank || "");
        setAnlagesumme(eintrag.anlagesumme || "");
        setZinssatz(eintrag.zinssatz);
        setLaufzeitMonate(eintrag.laufzeitMonate);
        setEroeffnungsdatum(eintrag.eroeffnungsdatum || "");
        setFaelligkeitsdatum(eintrag.faelligkeitsdatum);
        setLetzerKuendigungstag(eintrag.letzter_kuendigungstag);
        setGekuendigtAm(eintrag.gekuendigt_am);
        setZinsgutschrift(eintrag.zinsgutschrift);
        setZinseszins(eintrag.zinseszins);
        setFreistellungsauftrag(eintrag.freistellungsauftrag);
        setSteuerssatzAbzug(eintrag.steuersatz_abzug);
        setReferenzkonto(eintrag.ausgewaehltesReferenzkonto);
        setAutomatischVerlaengern(eintrag.automatisch_verlaengern);
        setIstAktiv(eintrag.ist_aktiv);
        setNotizen(eintrag.notizen);
        setIban(eintrag.iban);
        setBic(eintrag.bic);
        setKontoinhaber(eintrag.kontoinhaber);
        setGekuendigtAm(eintrag.gekuendigtAm || "");
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
                    asset_typ: assetTyp,
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
                    asset_typ: assetTyp,
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

        ladeFestgeld()
    };

    useEffect(() => {
        const init = async () => {
            try {
                await ladeFestgeld()
                await ladeKategorien();
                await ladeAssets();
                await ladeReferenzkonto()
            } catch (err) {
                console.error("Fehler in init:", err);
            }
        };
        init();
    }, []);


    return (
        <div className="festgeldkonto-container">
            <div className="header-bar">
                <h2>Festgeld</h2>
                <button className="btn-primary" onClick={() => {
                    setIban("");
                    setBic("");
                    setKontoinhaber("");
                    setZuBearbeiten(null);
                    setName(""); 
                    setBank(""); 
                    setAnlagesumme("");
                    setZinssatz(""); 
                    setLaufzeitMonate(""); 
                    setEroeffnungsdatum(""); 
                    setFaelligkeitsdatum("");
                    setZinsgutschrift("am_ende"); 
                    setZinseszins(false); 
                    setAusgewaehltesReferenzkonto("");
                    setKuendigungsfrist(""); 
                    setAutomatischVerlaengern(false); 
                    setFreistellungsauftrag("");
                    setTransaktionsNotizen(""); 
                    setErrors({});
                    setModalOffenHinzu(true);
                }}>
                    + Festgeldkonto hinzufügen
                </button>
            </div>

            {ansicht === 'card' ? (
                <div className="karten-grid">
                    {listeFestgeld.map((e) => {
                        const transaktionen = e.asset?.transaktionsprotokoll || [];

                        const aktuellerKontostand = transaktionen.reduce((acc, t) => {
                            const betrag = Number(t.betrag || 0);
                            return t.typ === 'einnahme' ? acc + betrag : acc - betrag;
                        }, Number(e.anlagesumme || 0));

                        return (
                            <div className="account-card" key={e.id}>
                                <div className="card-header">
                                    <div>
                                        <h3>{e.asset?.asset_name || e.name_der_bank}</h3>
                                        <span className="bank-name">{e.name_der_bank} ({e.land_der_bank || 'DE'})</span>
                                    </div>
                                    {e.automatisch_verlaengern && <span className="badge">Prolongation</span>}
                                    {e.status && <span className={`badge status-${e.status}`}>{e.status}</span>}
                                </div>

                                <div className="card-body">
                                    <div className="amount">
                                        <strong>{Number(e.anlagesumme || 0).toFixed(2)} EUR</strong>
                                        <span className="subtext">Anlagesumme ({e.zinssatz}% p.a.)</span>
                                    </div>

                                    <p className="info-text"><strong>Laufzeit:</strong> {e.laufzeit_monate} Monate</p>
                                    <p className="info-text"><strong>Fällig am:</strong> {e.faelligkeitsdatum}</p>
                                    {e.letzter_kuendigungstag && (
                                        <p className="info-text warning"><strong>Kündigen bis:</strong> {e.letzter_kuendigungstag}</p>
                                    )}
                                    {e.notizen && <p className="note">{e.notizen}</p>}
                                </div>

                                <div className="card-actions">
                                    <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                                    <button onClick={() => assetLoeschenMitLog(e.asset?.asset_id, "festgeld", "festgeld")} title="Löschen">🗑️</button>
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
                                <th>Anlagesumme</th>
                                <th>Zinssatz</th>
                                <th>Laufzeit</th>
                                <th>Fälligkeit</th>
                                <th>Status</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listeFestgeld.map((e) => {
                                return (
                                    <tr key={e.id}>
                                        <td>
                                            <strong>{e.asset?.asset_name || e.name_der_bank}</strong>
                                            <div className="subtext">{e.name_der_bank}</div>
                                        </td>
                                        <td><strong>{Number(e.anlagesumme || 0).toFixed(2)} EUR</strong></td>
                                        <td>{e.zinssatz}% p.a.</td>
                                        <td>{e.laufzeit_monate} Mon.</td>
                                        <td>{e.faelligkeitsdatum}</td>
                                        <td><span className={`badge status-${e.status}`}>{e.status || 'aktiv'}</span></td>
                                        <td className="table-actions">
                                            <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                                            <button onClick={() => assetLoeschenMitLog(e.asset?.asset_id, "festgeldkonto", "festgeldkonto")} title="Löschen">🗑️</button>
                                            <button onClick={() => transaktionenOeffnen(e.asset?.asset_id)} title="Transaktionen">💰</button>
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
                            {listeTransaktionenFestgeld.length === 0 ? (
                                <p className="empty-text">Keine Transaktionen für dieses Festgeldkonto vorhanden.</p>
                            ) : (
                                <ul className="transaction-list">
                                    {listeTransaktionenFestgeld.map((t) => (
                                        <li key={t.id} className="transaction-item">
                                            <div className="tx-info">
                                                <span className="tx-desc">{t.notizen || "Auszahlung / Zinsgutschrift"}</span>
                                                <span className="tx-date">{t.datum}</span>
                                            </div>
                                            <span className={`tx-amount ${t.typ === 'einnahme' ? 'positive' : 'negative'}`}>
                                                {t.typ === 'einnahme' ? '+' : '-'}{t.betrag} EUR
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
            {(modalOffenHinzu) && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>{modalOffenHinzu ? "Neues Festgeldkonto hinzufügen" : "Festgeldkonto bearbeiten"}</h3>
                            <button className="close-btn" onClick={() => { setModalOffenHinzu(false); setModalOffen(false); }}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Bezeichnung / Asset Name*</label>
                                    <input
                                        className={errors.name ? "input-error" : ""}
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: null }); }}
                                        placeholder="z.B. Festgeld 2 Jahre"
                                    />
                                    {errors.name && <span className="error-text">{errors.name}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Bank Name*</label>
                                    <input
                                        className={errors.bank ? "input-error" : ""}
                                        value={bank}
                                        onChange={(e) => { setBank(e.target.value); setErrors({ ...errors, bank: null }); }}
                                        placeholder="z.B. Klarna / WeltSparen"
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
                                    <label>Anlagesumme (€)*</label>
                                    <input
                                        type="number"
                                        className={errors.anlagesumme ? "input-error" : ""}
                                        value={anlagesumme}
                                        onChange={(e) => { setAnlagesumme(e.target.value); setErrors({ ...errors, anlagesumme: null }); }}
                                        placeholder="5000.00"
                                    />
                                    {errors.anlagesumme && <span className="error-text">{errors.anlagesumme}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Zinssatz (% p.a.)*</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={errors.zinssatz ? "input-error" : ""}
                                        value={zinssatz}
                                        onChange={(e) => { setZinssatz(e.target.value); setErrors({ ...errors, zinssatz: null }); }}
                                        placeholder="3.50"
                                    />
                                    {errors.zinssatz && <span className="error-text">{errors.zinssatz}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Laufzeit (Monate)*</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={errors.laufzeitMonate ? "input-error" : ""}
                                        value={laufzeitMonate}
                                        onChange={(e) => setLaufzeitMonate(e.target.value)}
                                        placeholder="12"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Eröffnungsdatum*</label>
                                    <input
                                        type="date"
                                        step="0.01"
                                        className={errors.eroeffnungsdatum ? "input-error" : ""}
                                        value={eroeffnungsdatum}
                                        onChange={(e) => setEroeffnungsdatum(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fälligkeitsdatum*</label>
                                    <input
                                        type="date"
                                        step="0.01"
                                        className={errors.faelligkeitsdatum ? "input-error" : ""}
                                        value={faelligkeitsdatum}
                                        onChange={(e) => setFaelligkeitsdatum(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Kündigungsfrist (Tage)</label>
                                    <input
                                        type="number"
                                        value={kuendigungsfrist}
                                        onChange={(e) => setKuendigungsfrist(e.target.value)}
                                        placeholder="30"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Zinsgutschrift</label>
                                    <select value={zinsgutschrift} onChange={(e) => setZinsgutschrift(e.target.value)}>
                                        <option value="am_ende">Am Ende der Laufzeit</option>
                                        <option value="jaehrlich">Jährlich</option>
                                    </select>
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Referenzkonto / Auszahlungskonto*</label>
                                    <select value={ausgewaehltesReferenzkonto} onChange={(e) => setAusgewaehltesReferenzkonto(e.target.value)}>
                                        <option value="">Referenzkonto auswählen...</option>
                                        {listeReferenzkonto.map(konto => (
                                            <option
                                                key={konto.id}
                                                value={konto.id}>
                                                {konto.girokonto
                                                    ? `Girokonto (${konto.girokonto.iban || konto.asset_name || ''})`
                                                    : `Tagesgeld (${konto.tagesgeldkonto?.iban || konto.asset_name || ''})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Notizen</label>
                                    <input value={transaktionsNotizen} onChange={(e) => setTransaktionsNotizen(e.target.value)} placeholder="Optionale Anmerkungen..." />
                                </div>
                                <div className="form-group">
                                    <label>Freistellingsauftrag</label>
                                    <input value={freistellungsauftrag} onChange={(e) => setFreistellungsauftrag(e.target.value)} placeholder="1000" />
                                </div>

                                <div className="form-group checkbox-group col-span-2">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={zinseszins} onChange={(e) => setZinseszins(e.target.checked)} />
                                        Zinseszins-Effekt (Thesaurierung)
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={automatischVerlaengern} onChange={(e) => setAutomatischVerlaengern(e.target.checked)} />
                                        Automatisch verlängern (Prolongation)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setModalOffenHinzu(false)}>Abbrechen</button>
                            <button className="btn-primary" onClick={handleFestgeldSpeichern}>Speichern</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Anpassen */}
            {(modalOffen) && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>Festgeldkonto bearbeiten</h3>
                            <button className="close-btn" onClick={() => setModalOffen(false)}></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Bezeichnung / Asset Name*</label>
                                    <input
                                        className={errors.name ? "input-error" : ""}
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: null }); }}
                                        placeholder="z.B. Festgeld 2 Jahre"
                                    />
                                    {errors.name && <span className="error-text">{errors.name}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Bank Name*</label>
                                    <input
                                        className={errors.bank ? "input-error" : ""}
                                        value={bank}
                                        onChange={(e) => { setBank(e.target.value); setErrors({ ...errors, bank: null }); }}
                                        placeholder="z.B. Klarna / WeltSparen"
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
                                    <label>Anlagesumme (€)*</label>
                                    <input
                                        type="number"
                                        className={errors.anlagesumme ? "input-error" : ""}
                                        value={anlagesumme}
                                        onChange={(e) => { setAnlagesumme(e.target.value); setErrors({ ...errors, anlagesumme: null }); }}
                                        placeholder="5000.00"
                                    />
                                    {errors.anlagesumme && <span className="error-text">{errors.anlagesumme}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Zinssatz (% p.a.)*</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={errors.zinssatz ? "input-error" : ""}
                                        value={zinssatz}
                                        onChange={(e) => { setZinssatz(e.target.value); setErrors({ ...errors, zinssatz: null }); }}
                                        placeholder="3.50"
                                    />
                                    {errors.zinssatz && <span className="error-text">{errors.zinssatz}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Laufzeit (Monate)*</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={errors.laufzeitMonate ? "input-error" : ""}
                                        value={laufzeitMonate}
                                        onChange={(e) => setLaufzeitMonate(e.target.value)}
                                        placeholder="12"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Eröffnungsdatum*</label>
                                    <input
                                        type="date"
                                        step="0.01"
                                        className={errors.eroeffnungsdatum ? "input-error" : ""}
                                        value={eroeffnungsdatum}
                                        onChange={(e) => setEroeffnungsdatum(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fälligkeitsdatum*</label>
                                    <input
                                        type="date"
                                        step="0.01"
                                        className={errors.faelligkeitsdatum ? "input-error" : ""}
                                        value={faelligkeitsdatum}
                                        onChange={(e) => setFaelligkeitsdatum(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Kündigungsfrist (Tage)</label>
                                    <input
                                        type="number"
                                        value={kuendigungsfrist}
                                        onChange={(e) => setKuendigungsfrist(e.target.value)}
                                        placeholder="30"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Gekündigt am*</label>
                                    <input
                                        type="date"
                                        step="0.01"
                                        className={errors.gekuendigtAm ? "input-error" : ""}
                                        value={gekuendigtAm}
                                        onChange={(e) => setGekuendigtAm(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Zinsgutschrift</label>
                                    <select value={zinsgutschrift} onChange={(e) => setZinsgutschrift(e.target.value)}>
                                        <option value="am_ende">Am Ende der Laufzeit</option>
                                        <option value="jaehrlich">Jährlich</option>
                                    </select>
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Referenzkonto / Auszahlungskonto*</label>
                                    <select value={ausgewaehltesReferenzkonto} onChange={(e) => setAusgewaehltesReferenzkonto(e.target.value)}>
                                        <option value="">Referenzkonto auswählen...</option>
                                        {listeReferenzkonto.map(konto => (
                                            <option
                                                key={konto.id}
                                                value={konto.id}>
                                                {konto.girokonto
                                                    ? `Girokonto (${konto.girokonto.iban || konto.asset_name || ''})`
                                                    : `Tagesgeld (${konto.tagesgeldkonto?.iban || konto.asset_name || ''})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Notizen</label>
                                    <input value={transaktionsNotizen} onChange={(e) => setTransaktionsNotizen(e.target.value)} placeholder="Optionale Anmerkungen..." />
                                </div>
                                <div className="form-group">
                                    <label>Freistellingsauftrag</label>
                                    <input value={freistellungsauftrag} onChange={(e) => setFreistellungsauftrag(e.target.value)} placeholder="1000" />
                                </div>

                                <div className="form-group checkbox-group col-span-2">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={zinseszins} onChange={(e) => setZinseszins(e.target.checked)} />
                                        Zinseszins-Effekt (Thesaurierung)
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={automatischVerlaengern} onChange={(e) => setAutomatischVerlaengern(e.target.checked)} />
                                        Automatisch verlängern (Prolongation)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setModalOffen(false)}>Abbrechen</button>
                            <button className="btn-primary" onClick={handleFestgeldSpeichern}>Speichern</button>
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

        </div>
    );
}