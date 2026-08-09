import { useEffect, useState, useContext } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import { SettingsContext } from '../SettingsContext';

export default function Girokonto() {
    const [listeGirokonto, setListeGirokonto] = useState([]);
    const [name, setName] = useState("");
    const [bank, setBank] = useState("");
    const [iban, setIban] = useState("");
    const [kontoinhaber, setKontoinhaber] = useState("");
    const [ist_aktiv, setIstAktiv] = useState(true);
    const [hauptkonto, setHauptkonto] = useState(false);
    const [elternkontoListe, setElternkontoListe] = useState([]);
    const [ausgewaehltesElternkonto, setAusgewaehltesElternkonto] = useState("");
    const [dispo_limit, setDispoLimit] = useState("");
    const [bic, setBic] = useState("");
    const [zinssatz, setZinssatz] = useState("");
    const [einzahlung_bei_eroeffnung, setEinzahlung_bei_eroeffnung] = useState("");
    const [waehrung, setWaehrung] = useState("EUR");
    const [eroeffnungsdatum, setEroeffnungsdatum] = useState("");
    const [modalOffen, setModalOffen] = useState(false);
    const [modalOffenHinzu, setModalOffenHinzu] = useState(false);
    const [zuBearbeiten, setZuBearbeiten] = useState(null);
    const [modalOffenTransaktionen, setModalOffenTransaktionen] = useState(false);
    const [listeTransaktionenGirokonto, setListeTransaktionenGirokonto] = useState([]);
    const [modalTranskationenHinzufuegen, setModalTranskationenHinzufuegen] = useState(false);
    const [transaktionsNotizen, setTransaktionsNotizen] = useState("");
    const [transaktionsBetrag, setTransaktionsBetrag] = useState("");
    const [transaktionsKategorie, setTransaktionsKategorie] = useState("");
    const [transaktionsTyp, setTransaktionsTyp] = useState("");
    const [ausgewaehltesAsset, setAusgewaehltesAsset] = useState("");
    const [kategorien, setKategorien] = useState([]);
    const [ist_referenzkonto, setIstReferenzkonto] = useState(false);
    const [wiederkehrendaktiv, setWiederkehrendaktiv] = useState(false);
    const [intervall, setIntervall] = useState("");
    const [naechsteFaelligkeit, setNaechsteFaelligkeit] = useState("");
    const [assets, setAssets] = useState([]);
    const [errors, setErrors] = useState({});

    const { ansicht } = useContext(SettingsContext);

    const ladeGirokonto = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("girokonto")
            .select(`*, 
                asset(
                    benutzer_id,
                    asset_name,
                    asset_id,
                    transaktionsprotokoll(betrag, typ)
                )
            `)
            .eq("benutzer_id", user.id);

        if (handleApiError(error, "Girokonto laden")) return;
        if (data) setListeGirokonto(data);
    };

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

        setModalOffenTransaktionen(true);
        setAusgewaehltesAsset(assetId);

        const { data, error } = await supabase
            .from("transaktionsprotokoll")
            .select("*")
            .eq("asset_id", assetId)
            .order('datum', { ascending: false });

        if (handleApiError(error, "Transaktionen öffnen")) return;
        if (data) setListeTransaktionenGirokonto(data);
    };

    const girokontoHinzufuegen = async () => {
        if (!name || !bank || !iban || !waehrung || !eroeffnungsdatum) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data: assetData, error: assetError } = await supabase
                .from("asset")
                .insert({
                    benutzer_id: user.id,
                    asset_name: name,
                    asset_typ: "girokonto",
                })
                .select();

            if (assetError || !assetData || assetData.length === 0) {
                console.error("Fehler beim Erstellen des Assets:", assetError?.message || JSON.stringify(assetError));
                alert("Fehler beim Erstellen des übergeordneten Assets.");
                return;
            }

            const asset_id = assetData[0].asset_id;

            const { error: giroError } = await supabase
                .from("girokonto")
                .insert({
                    asset_id: asset_id,
                    benutzer_id: user.id, // Direct user ID binding
                    name_der_bank: bank,
                    iban: iban,
                    einzahlung_bei_eroeffnung: parseFloat(einzahlung_bei_eroeffnung) || 0,
                    waehrung: waehrung,
                    eroeffnungsdatum: eroeffnungsdatum,
                    notizen: transaktionsNotizen,
                    kontoinhaber: kontoinhaber,
                    ist_aktiv: true,
                    hauptkonto: hauptkonto,
                    elternkonto: ausgewaehltesElternkonto || null,
                    dispo_limit: parseFloat(dispo_limit) || 0,
                    bic: bic,
                    zinssatz: parseFloat(zinssatz) || 0,
                    ist_referenzkonto: ist_referenzkonto || false
                });

            if (giroError) {
                console.error("Fehler beim Erstellen des Girokontos:", giroError);
                alert("Fehler beim Girokonto-Insert.");
                return;
            }

            const { error: transError } = await supabase
                .from("transaktionsprotokoll")
                .insert({
                    benutzer_id: user.id,
                    notizen: "Einzahlung bei Eröffnung",
                    betrag: parseFloat(einzahlung_bei_eroeffnung) || 0,
                    kategorie_id: 'd5473c35-2e52-41ef-82a2-3eef5aff038f',
                    asset_id: asset_id,
                    assetklasse: "girokonto",
                    typ: "einnahme"
                });

            if (transError) {
                console.error("Fehler beim Erstellen der Transaktion Eroeffnung:", transError);
                alert("Fehler beim Girokonto-Insert.");
                return;
            }

            setName("");
            setBank("");
            setIban("");
            setEinzahlung_bei_eroeffnung("");
            setWaehrung("EUR");
            setEroeffnungsdatum("");
            setTransaktionsNotizen("");
            setKontoinhaber("");
            setIstAktiv(true);
            setHauptkonto(false);
            setAusgewaehltesElternkonto("");
            setDispoLimit("");
            setBic("");
            setZinssatz("");
            setModalOffenHinzu(false);

            ladeGirokonto();
        } catch (err) {
            console.error("Unerwarteter Fehler:", err);
        }
    };

    const bearbeitenOeffnen = (eintrag) => {
        setZuBearbeiten(eintrag);
        setName(eintrag.asset?.asset_name || "");
        setBank(eintrag.name_der_bank || "");
        setIban(eintrag.iban || "");
        setEinzahlung_bei_eroeffnung(eintrag.einzahlung_bei_eroeffnung || "");
        setWaehrung(eintrag.waehrung || "EUR");
        setEroeffnungsdatum(eintrag.eroeffnungsdatum || "");
        setTransaktionsNotizen(eintrag.notizen || "");
        setKontoinhaber(eintrag.kontoinhaber || "");
        setIstAktiv(eintrag.ist_aktiv ?? true);
        setHauptkonto(eintrag.hauptkonto ?? false);
        setAusgewaehltesElternkonto(eintrag.elternkonto || "");
        setDispoLimit(eintrag.dispo_limit || "");
        setBic(eintrag.bic || "");
        setZinssatz(eintrag.zinssatz || "");
        setIstReferenzkonto(eintrag.ist_referenzkonto || false);
        setModalOffen(true);
    };


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

        ladeGirokonto()
    };


    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) newErrors.name = "Asset Name ist erforderlich";
        if (!bank.trim()) newErrors.bank = "Bank Name ist erforderlich";
        if (!iban.trim()) newErrors.iban = "IBAN ist erforderlich";
        if (!waehrung.trim()) newErrors.waehrung = "Währung ist erforderlich";
        if (!eroeffnungsdatum) newErrors.eroeffnungsdatum = "Eröffnungsdatum ist erforderlich";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // true, wenn keine Fehler vorhanden
    };

    const handleGirokontoSpeichern = () => {
        if (validateForm()) {

            if (zuBearbeiten) {
                girokontoSpeichern();
                setErrors({});
            }
            else {
                girokontoHinzufuegen();
                setErrors({});
            }

        }
    };

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
                notizen: transaktionsNotizen,
                kontoinhaber: kontoinhaber,
                ist_aktiv: ist_aktiv,
                hauptkonto: hauptkonto,
                elternkonto: ausgewaehltesElternkonto || null,
                dispo_limit: parseFloat(dispo_limit) || 0,
                bic: bic,
                zinssatz: parseFloat(zinssatz) || 0,
                ist_referenzkonto: ist_referenzkonto || false
            })
            .eq("asset_id", zuBearbeiten.asset_id);

        if (handleApiError(giroError, "Girokontodaten updaten")) return;


        setName("");
        setBank("");
        setIban("");
        setEinzahlung_bei_eroeffnung("");
        setWaehrung("EUR");
        setEroeffnungsdatum("");
        setTransaktionsNotizen("");
        setKontoinhaber("");
        setIstAktiv(true);
        setHauptkonto(false);
        setAusgewaehltesElternkonto("");
        setDispoLimit("");
        setBic("");
        setZinssatz("");
        setModalOffen(false);
        setZuBearbeiten(null);
        ladeGirokonto();
    };

    const transaktionHinzufuegen = async (assetId) => {
        if (!transaktionsNotizen || !transaktionsBetrag || !transaktionsKategorie || !transaktionsTyp) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let berechneteFaelligkeit = null;

        if (wiederkehrendaktiv) {
            const heute = new Date();

            switch (intervall) {
                case "täglich":
                    heute.setDate(heute.getDate() + 1);
                    break;
                case "wöchentlich":
                    heute.setDate(heute.getDate() + 7);
                    break;
                case "monatlich":
                    heute.setMonth(heute.getMonth() + 1);
                    break;
                case "jährlich":
                    heute.setFullYear(heute.getFullYear() + 1);
                    break;
                default:
                    break;
            }

            berechneteFaelligkeit = heute.toISOString();
        }

        const { error } = await supabase.from("transaktionsprotokoll").insert({
            benutzer_id: user.id,
            notizen: transaktionsNotizen,
            betrag: parseFloat(transaktionsBetrag),
            kategorie_id: transaktionsKategorie,
            asset_id: assetId,
            assetklasse: "girokonto",
            typ: transaktionsTyp,
            wiederkehrend: wiederkehrendaktiv,
            naechste_faelligkeit: berechneteFaelligkeit,
            intervall: wiederkehrendaktiv ? intervall : null
        });

        if (handleApiError(error, "Transaktion hinzufügen")) return;

        // State zurücksetzen
        setTransaktionsNotizen("");
        setTransaktionsBetrag("");
        setTransaktionsKategorie("");
        setTransaktionsTyp("");
        setWiederkehrendaktiv(false);
        setIntervall("");
        setNaechsteFaelligkeit("");

        ladeGirokonto();
        transaktionenOeffnen(ausgewaehltesAsset);
        setModalTranskationenHinzufuegen(false);
    };

    const pruefeWiederkehren = async () => {

        const heute = new Date().toISOString();


        const { data: faellige, error } = await supabase
            .from("transaktionsprotokoll")
            .select("*")
            .eq("wiederkehrend", true)
            .lte("naechste_faelligkeit", heute);

        if (error || !faellige || faellige.length === 0) return;

        for (const t of faellige) {
            await supabase.from("transaktionsprotokoll").insert({
                benutzer_id: t.benutzer_id,
                notizen: `${t.notizen} (Automatisch)`,
                betrag: t.betrag,
                kategorie_id: t.kategorie_id,
                asset_id: t.asset_id,
                assetklasse: t.assetklasse,
                typ: t.typ,
                datum: heute,
                wiederkehrend: false
            });

            const naechstesDatum = new Date(t.naechste_faelligkeit);
            if (t.intervall === "täglich") naechstesDatum.setDate(naechstesDatum.getDate() + 1);
            if (t.intervall === "wöchentlich") naechstesDatum.setDate(naechstesDatum.getDate() + 7);
            if (t.intervall === "monatlich") naechstesDatum.setMonth(naechstesDatum.getMonth() + 1);
            if (t.intervall === "jährlich") naechstesDatum.setFullYear(naechstesDatum.getFullYear() + 1);


            await supabase
                .from("transaktionsprotokoll")
                .update({ naechste_faelligkeit: naechstesDatum.toISOString().split('T')[0] })
                .eq("id", t.id);
        }
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

    const ladeElternkontoListe = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("girokonto")
            .select("*")
            .eq("benutzer_id", user.id)
            .eq("hauptkonto", true);

        if (data) setElternkontoListe(data);
    };

    useEffect(() => {
        const init = async () => {
            try {
                await pruefeWiederkehren();
                await ladeAssets();
                await ladeGirokonto();
                await ladeKategorien();
                await ladeElternkontoListe();
            } catch (err) {
                console.error("Fehler in init:", err);
            }
        };
        init();
    }, []);

    return (
        <div className="girokonto-container">
            <div className="header-bar">
                <h2>Girokonto</h2>
                <button className="btn-primary" onClick={() => {
                    setModalOffenHinzu(true);
                    setZuBearbeiten(null);
                    setName(""); setBank(""); setIban(""); setEinzahlung_bei_eroeffnung("");
                    setWaehrung("EUR"); setEroeffnungsdatum(""); setTransaktionsNotizen("");
                    setKontoinhaber(""); setIstAktiv(true); setHauptkonto(false); setAusgewaehltesElternkonto(""); setDispoLimit("");
                    setBic(""); setZinssatz("");
                }}>
                    + Girokonto hinzufügen
                </button>
            </div>

            {ansicht === 'card' ? (
                <div className="karten-grid">
                    {listeGirokonto.map((e) => {
                        const gefundenerEintrag = listeGirokonto.find(k => k.asset?.asset_id === e.elternkonto);
                        const elternkontoName = gefundenerEintrag ? gefundenerEintrag.asset?.asset_name : null;

                        const transaktionen = e.asset?.transaktionsprotokoll || [];
                        const summeTransaktionen = transaktionen.reduce((acc, t) => {
                            const betrag = Number(t.betrag || 0);
                            return t.typ === 'einnahme' ? acc + betrag : acc - betrag;
                        }, 0);

                        // 💡 KORREKTUR: Startguthaben + Transaktionssumme
                        const aktuellerKontostand = summeTransaktionen;

                        return (
                            <div className="account-card" key={e.id}>
                                <div className="card-header">
                                    <div>
                                        <h3>{e.asset?.asset_name}</h3>
                                        <span className="bank-name">{e.name_der_bank}</span>
                                    </div>
                                    <div className="badge-group">
                                        {e.hauptkonto && <span className="badge badge-primary">Hauptkonto</span>}
                                        {e.ist_referenzkonto && <span className="badge badge-info">Referenzkonto</span>}
                                        {e.ist_aktiv === false && <span className="badge badge-warning">Inaktiv</span>}
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="amount">
                                        <strong>{aktuellerKontostand.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {e.waehrung}</strong>
                                    </div>

                                    <p className="iban"><strong>IBAN:</strong> {e.iban}</p>
                                    {e.bic && <p className="sub-text"><strong>BIC:</strong> {e.bic}</p>}
                                    {e.kontoinhaber && <p className="sub-text"><strong>Inhaber:</strong> {e.kontoinhaber}</p>}

                                    {/* 💡 ERGÄNZUNG: Zusätzliche nützliche Finanzdetails */}
                                    <div className="account-details-grid">
                                        {Number(e.dispo_limit) > 0 && (
                                            <p className="detail-item"><strong>Dispo:</strong> {Number(e.dispo_limit).toFixed(2)} {e.waehrung}</p>
                                        )}
                                        {Number(e.zinssatz) > 0 && (
                                            <p className="detail-item"><strong>Zins:</strong> {e.zinssatz}%</p>
                                        )}
                                    </div>

                                    {elternkontoName && <p className="parent"><strong>Elternkonto:</strong> {elternkontoName}</p>}
                                    {e.notizen && <p className="note">{e.notizen}</p>}
                                </div>

                                <div className="card-actions">
                                    <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                                    <button onClick={() => assetLoeschenMitLog(e.asset?.asset_id, "girokonto", "girokonto")} title="Löschen">🗑️</button>
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
                                <th>IBAN / BIC</th>
                                <th>Guthaben</th>
                                <th>Konto-Details</th>
                                <th>Inhaber</th>
                                <th>Elternkonto</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listeGirokonto.map((e) => {
                                const gefundenerEintrag = listeGirokonto.find(k => k.asset?.asset_id === e.elternkonto);
                                const elternkontoName = gefundenerEintrag ? gefundenerEintrag.asset?.asset_name : "—";

                                const transaktionen = e.asset?.transaktionsprotokoll || [];
                                const summe = transaktionen.reduce((acc, t) => {
                                    const betrag = Number(t.betrag || 0);
                                    return t.typ === 'einnahme' ? acc + betrag : acc - betrag;
                                }, 0);


                                const aktuellerKontostand = Number(e.einzahlung_bei_eroeffnung || 0) + summe;

                                return (
                                    <tr key={e.id} className={e.ist_aktiv === false ? 'row-inactive' : ''}>
                                        <td>
                                            <strong>{e.asset?.asset_name}</strong>
                                            <div className="subtext">{e.name_der_bank}</div>
                                            {e.hauptkonto && <span className="badge-small">Hauptkonto</span>}
                                        </td>
                                        <td className="code-text">
                                            <div>{e.iban}</div>
                                            {e.bic && <div className="subtext">BIC: {e.bic}</div>}
                                        </td>
                                        <td>
                                            <strong>{aktuellerKontostand.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {e.waehrung}</strong>
                                        </td>
                                        {/* 💡 ERGÄNZUNG: Dispo und Zinsen übersichtlich in der Tabelle */}
                                        <td className="subtext">
                                            {Number(e.dispo_limit) > 0 && <div>Dispo: {e.dispo_limit} {e.waehrung}</div>}
                                            {Number(e.zinssatz) > 0 && <div>Zins: {e.zinssatz}%</div>}
                                            {!Number(e.dispo_limit) && !Number(e.zinssatz) && "—"}
                                        </td>
                                        <td>{e.kontoinhaber || "—"}</td>
                                        <td>{elternkontoName}</td>
                                        <td className="table-actions">
                                            <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                                            <button onClick={() => assetLoeschenMitLog(e.asset?.asset_id, "girokonto", "girokonto")} title="Löschen">🗑️</button>
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
                            {listeTransaktionenGirokonto.length === 0 ? (
                                <p className="empty-text">Keine Transaktionen für dieses Konto vorhanden.</p>
                            ) : (
                                <ul className="transaction-list">
                                    {listeTransaktionenGirokonto.map((t) => (
                                        <li key={t.id} className="transaction-item">
                                            <div className="tx-info">
                                                <span className="tx-desc">{t.notizen || "Ohne Notizen"}</span>
                                                <span className="tx-date">{t.datum}</span>
                                            </div>
                                            <span className={`tx-amount ${t.typ === 'einnahme' ? 'positive' : 'negative'}`}>
                                                {t.typ === 'einnahme' ? '+' : '-'}{Number(t.betrag).toFixed(2)} {t.waehrung || 'EUR'}
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
                            <h3>Neues Girokonto hinzufügen</h3>
                            <button className="close-btn" onClick={() => { setErrors({}); setModalOffenHinzu(false); }}>✕</button>
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
                                    <label>Kontoinhaber</label>
                                    <input value={kontoinhaber} onChange={(e) => setKontoinhaber(e.target.value)} placeholder="Max Mustermann" />
                                </div>
                                <div className="form-group">
                                    <label>BIC</label>
                                    <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BIC Code" />
                                </div>
                                <div className="form-group">
                                    <label>Dispo-Limit</label>
                                    <input value={dispo_limit} onChange={(e) => setDispoLimit(e.target.value)} placeholder="0.00" type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Zinssatz (%)</label>
                                    <input value={zinssatz} onChange={(e) => setZinssatz(e.target.value)} placeholder="0.00" type="number" step="0.01" />
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Notizen</label>
                                    <input value={transaktionsNotizen} onChange={(e) => setTransaktionsNotizen(e.target.value)} placeholder="Optionale Notiz..." />
                                </div>

                                <div className="form-group checkbox-group col-span-2">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={hauptkonto} onChange={(e) => setHauptkonto(e.target.checked)} />
                                        Als Hauptkonto festlegen
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={ist_referenzkonto} onChange={(e) => setIstReferenzkonto(e.target.checked)} />
                                        Als Referenzkonto festlegen
                                    </label>
                                </div>

                                {!hauptkonto && (
                                    <div className="form-group col-span-2">
                                        <label>Elternkonto auswählen</label>
                                        <select value={ausgewaehltesElternkonto} onChange={(e) => setAusgewaehltesElternkonto(e.target.value)}>
                                            <option value="">Kein Elternkonto (Optional)</option>
                                            {listeGirokonto.map((e) => (
                                                <option key={e.asset?.asset_id} value={e.asset?.asset_id}>
                                                    {e.asset?.asset_name} ({e.name_der_bank})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => { setErrors({}); setModalOffenHinzu(false); }}>Abbrechen</button>
                            <button className="btn-primary" onClick={handleGirokontoSpeichern}>Speichern</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Bearbeiten */}
            {modalOffen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>Girokonto bearbeiten</h3>
                            <button className="close-btn" onClick={() => setModalOffen(false)}>✕</button>
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
                                    <label>Startguthaben</label>
                                    <input
                                        className={errors.einzahlung ? "input-error" : ""}
                                        value={einzahlung_bei_eroeffnung}
                                        onChange={(e) => { setEinzahlung_bei_eroeffnung(e.target.value); setErrors({ ...errors, einzahlung: null }); }}
                                        placeholder="0.00"
                                        type="number"
                                    />
                                    {errors.einzahlung && <span className="error-text">{errors.einzahlung}</span>}
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
                                    <label>Kontoinhaber</label>
                                    <input value={kontoinhaber} onChange={(e) => setKontoinhaber(e.target.value)} placeholder="Max Mustermann" />
                                </div>
                                <div className="form-group">
                                    <label>BIC</label>
                                    <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BIC Code" />
                                </div>
                                <div className="form-group">
                                    <label>Dispo-Limit</label>
                                    <input value={dispo_limit} onChange={(e) => setDispoLimit(e.target.value)} placeholder="0.00" type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Zinssatz (%)</label>
                                    <input value={zinssatz} onChange={(e) => setZinssatz(e.target.value)} placeholder="0.00" type="number" step="0.01" />
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Notizen</label>
                                    <input value={transaktionsNotizen} onChange={(e) => setTransaktionsNotizen(e.target.value)} placeholder="Optionale Notiz..." />
                                </div>

                                <div className="form-group checkbox-group col-span-2">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={ist_aktiv} onChange={(e) => setIstAktiv(e.target.checked)} />
                                        Konto ist Aktiv
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={hauptkonto} onChange={(e) => setHauptkonto(e.target.checked)} />
                                        Hauptkonto
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={ist_referenzkonto} onChange={(e) => setIstReferenzkonto(e.target.checked)} />
                                        Referenzkonto
                                    </label>
                                </div>

                                {!hauptkonto && (
                                    <div className="form-group col-span-2">
                                        <label>Elternkonto wählen</label>
                                        <select value={ausgewaehltesElternkonto} onChange={(e) => setAusgewaehltesElternkonto(e.target.value)}>
                                            <option value="">Kein Elternkonto (Optional)</option>
                                            {listeGirokonto.map((e) => (
                                                <option key={e.asset?.asset_id} value={e.asset?.asset_id}>
                                                    {e.asset?.asset_name} ({e.name_der_bank})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setModalOffen(false)}>Abbrechen</button>
                            <button className="btn-primary" onClick={handleGirokontoSpeichern}>Speichern</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 💡 KORREKTUR: Transaktion hinzufügen Modal an das CSS-Klassendesign angepasst */}
            {modalTranskationenHinzufuegen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>Transaktion hinzufügen</h3>
                            <button className="close-btn" onClick={() => setModalTranskationenHinzufuegen(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group col-span-2">
                                    <label>Notizen</label>
                                    <input
                                        value={transaktionsNotizen}
                                        onChange={(e) => setTransaktionsNotizen(e.target.value)}
                                        placeholder="Beschreibung der Transaktion"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Betrag</label>
                                    <input
                                        value={transaktionsBetrag}
                                        onChange={(e) => setTransaktionsBetrag(e.target.value)}
                                        placeholder="0.00"
                                        type="number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Typ</label>
                                    <select
                                        value={transaktionsTyp}
                                        onChange={(e) => setTransaktionsTyp(e.target.value)}
                                    >
                                        <option value="">Typ wählen</option>
                                        <option value="ausgabe">Ausgabe</option>
                                        <option value="einnahme">Einnahme</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Kategorie</label>
                                    <select
                                        value={transaktionsKategorie}
                                        onChange={(e) => setTransaktionsKategorie(e.target.value)}
                                    >
                                        <option value="">Kategorie wählen</option>
                                        {kategorien.map((k) => (
                                            <option key={k.id} value={k.id}>{k.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Asset</label>
                                    <select
                                        value={ausgewaehltesAsset}
                                        onChange={(e) => setAusgewaehltesAsset(e.target.value)}
                                    >
                                        <option value="">Asset wählen</option>
                                        {assets.map((a) => (
                                            <option key={a.asset_id} value={a.asset_id}>
                                                {a.asset_typ} | {a.asset_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group checkbox-group col-span-2">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={wiederkehrendaktiv}
                                            onChange={(e) => setWiederkehrendaktiv(e.target.checked)}
                                        />
                                        Wiederkehrende Transaktion
                                    </label>
                                </div>

                                {wiederkehrendaktiv && (
                                    <div className="form-group col-span-2">
                                        <label>Intervall</label>
                                        <select
                                            value={intervall}
                                            onChange={(e) => setIntervall(e.target.value)}
                                        >
                                            <option value="">Intervall wählen</option>
                                            <option value="täglich">Täglich</option>
                                            <option value="wöchentlich">Wöchentlich</option>
                                            <option value="monatlich">Monatlich</option>
                                            <option value="jährlich">Jährlich</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setModalTranskationenHinzufuegen(false)}>Abbrechen</button>
                            <button className="btn-primary" onClick={transaktionHinzufuegen}>Hinzufügen</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}