import { useEffect, useState, useContext } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import { SettingsContext } from '../SettingsContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const [notifyInfoValue, setNotifyInfoValue] = useState("");

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
        
        if (data) setNotifyInfoValue(true);


        if (handleApiError(error, "Transaktionen öffnen")) return;
        if (data) setListeTransaktionenTagesgeld(data)

        if (notifyInfoValue === true) {
            console.log("Daten geladen:", data);
            notifyInfo(data);
        }
        
    }

    const notifyInfo = (data) => toast.info(data);

        

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

    const tagesgeldkontoHinzufuegen = async () => {
        if (!name || !bank || !iban || !einzahlung_bei_eroeffnung || !waehrung || !eroeffnungsdatum) return

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
                    waehrung: waehrung,
                    zinssatz: parseFloat(zinssatz) || 0,
                    zinsintervall: zinssintervall || "monatlich",
                    referenzkonto: ausgewaehltesReferenzkonto,
                    freistellungsauftrag: freistellungsauftrag || "",
                    aktionszins: parseFloat(aktionszins) || 0,
                    ablaufdatum_aktionszins: ablaufdatum_aktionszins || null,
                    notgroschen: notgroschen || false,
                    einlagensicherung: parseFloat(einlagensicherung) || 100000,
                    sparrate: parseFloat(sparrate) || 0,
                    sparziel: parseFloat(sparziel) || 0,
                    mindestbetrag: parseFloat(mindestbetrag) || 0,
                    ist_aktiv: true,
                    notizen: transaktionsNotizen,
                    eroeffnungsdatum: eroeffnungsdatum,
                    kontoinhaber: kontoinhaber,
                    bic: bic,
                    einzahlung_bei_eroeffnung: parseFloat(einzahlung_bei_eroeffnung) || 0,
                    ist_referenzkonto: false
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

    const eintragLoeschen = async (assetId) => {
        if (!assetId) return;

        const { error: tagesgeldkontoError } = await supabase
            .from("tagesgeldkonto")
            .delete()
            .eq("asset_id", assetId)
            .select();

        console.log("Fehler Tagesgeldkonto:", tagesgeldkontoError);

        if (handleApiError(tagesgeldkontoError, "Tagesgeldkonto löschen")) return;

        const { error: assetError } = await supabase
            .from("asset")
            .delete()
            .eq("asset_id", assetId)
            .select();

        console.log("Fehler Asset:", assetError);

        if (handleApiError(assetError, "Asset löschen")) return;

        await ladeTagesgeld()
    }

    const tagesgeldkontoSpeichern = async () => {
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
                freistellungsauftrag: freistellungsauftrag || "",
                aktionszins: parseFloat(aktionszins) || 0,
                ablaufdatum_aktionszins: ablaufdatum_aktionszins || null,
                notgroschen: notgroschen || false,
                einlagensicherung: parseFloat(einlagensicherung) || 100000,
                sparrate: parseFloat(sparrate) || 0,
                sparziel: parseFloat(sparziel) || 0,
                mindestbetrag: parseFloat(mindestbetrag) || 0,
                ist_aktiv: ist_aktiv,
                notizen: transaktionsNotizen,
                eroeffnungsdatum: eroeffnungsdatum,
                kontoinhaber: kontoinhaber,
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
                                    <button onClick={() => eintragLoeschen(e.asset?.asset_id)} title="Löschen">🗑️</button>
                                    <button onClick={() => transaktionenOeffnen(e.asset?.asset_id)} title="Transaktionen">💰</button>
                                    <div>
                                        <button onClick={notifyInfo}>Erfolg zeigen</button>
                                        <ToastContainer position="top-right" autoClose={3000} />
                                    </div>
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
                                <th>Elternkonto</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listeTagesgeld.map((e) => {
                                const gefundenerEintrag = listeTagesgeld.find(k => k.asset?.asset_id === e.referenzkonto);
                                const elternkontoName = gefundenerEintrag ? gefundenerEintrag.asset?.asset_name : "—";

                                const transaktionen = e.asset?.transaktionsprotokoll || [];
                                const summe = transaktionen.reduce((acc, t) => {
                                    const betrag = Number(t.betrag || 0);
                                    return t.typ === 'einnahme' ? acc + betrag : acc - betrag;
                                }, 0);
                                const aktuellerKontostand = Number(e.einzahlung_bei_eroeffnung || 0) + summe;

                                return (
                                    <tr key={e.id}>
                                        <td>
                                            <strong>{e.asset?.asset_name}</strong>
                                            <div className="subtext">{e.name_der_bank}</div>
                                        </td>
                                        <td className="code-text">{e.iban}</td>
                                        <td><strong>{aktuellerKontostand.toFixed(2)} {e.waehrung}</strong></td>
                                        <td>{e.kontoinhaber || "—"}</td>
                                        <td>{elternkontoName}</td>
                                        <td className="table-actions">
                                            <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
                                            <button onClick={() => eintragLoeschen(e.asset?.asset_id)}>🗑️</button>
                                            <button onClick={() => transaktionenOeffnen(e.asset?.asset_id)}>💰</button>
                                            <div>
                                                <button onClick={notifyInfo}>Erfolg zeigen</button>
                                                <ToastContainer position="top-right" autoClose={3000} />
                                            </div>
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
                                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Notgroschen ING" />
                                </div>
                                <div className="form-group">
                                    <label>Bank Name*</label>
                                    <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="z.B. ING" />
                                </div>
                                <div className="form-group col-span-2">
                                    <label>IBAN*</label>
                                    <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="DE00 0000 0000 0000 0000 00" />
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
                                    <label>Startguthaben*</label>
                                    <input value={einzahlung_bei_eroeffnung} onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} placeholder="0.00" type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Währung*</label>
                                    <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} placeholder="EUR" />
                                </div>
                                <div className="form-group">
                                    <label>Eröffnungsdatum*</label>
                                    <input type="date" value={eroeffnungsdatum} onChange={(e) => setEroeffnungsdatum(e.target.value)} />
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
                                    <input value={sparziel} onChange={(e) => setSparziel(e.target.value)} placeholder="5000.00" type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Sparrate (€/Monat)</label>
                                    <input value={sparrate} onChange={(e) => setSparrate(e.target.value)} placeholder="200.00" type="number" />
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
                                    <input value={freistellungsauftrag} onChange={(e) => setFreistellungsauftrag(e.target.value)} />
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
                            <button className="btn-primary" onClick={tagesgeldkontoHinzufuegen}>Speichern</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Bearbeiten */}
            {modalOffen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>Tagesgeldkonto bearbeiten</h3>
                            <button className="close-btn" onClick={() => setModalOffen(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Asset Name</label>
                                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset Name" />
                                </div>
                                <div className="form-group">
                                    <label>Bank</label>
                                    <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank" />
                                </div>
                                <div className="form-group col-span-2">
                                    <label>IBAN</label>
                                    <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="IBAN" />
                                </div>
                                <div className="form-group">
                                    <label>BIC</label>
                                    <input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BIC Code" />
                                </div>
                                <div className="form-group">
                                    <label>Kontoinhaber</label>
                                    <input value={kontoinhaber} onChange={(e) => setKontoinhaber(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Guthaben bei Eröffnung</label>
                                    <input value={einzahlung_bei_eroeffnung} onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)} type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Währung</label>
                                    <input value={waehrung} onChange={(e) => setWaehrung(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Eröffnungsdatum</label>
                                    <input type="date" value={eroeffnungsdatum} onChange={(e) => setEroeffnungsdatum(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Zinssatz (% p.a.)</label>
                                    <input value={zinssatz} onChange={(e) => setZinssatz(e.target.value)} type="number" step="0.01" />
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
                                    <input value={aktionszins} onChange={(e) => setAktionszins(e.target.value)} type="number" step="0.01" />
                                </div>
                                <div className="form-group">
                                    <label>Ablaufdatum Aktionszins</label>
                                    <input type="date" value={ablaufdatum_aktionszins} onChange={(e) => setAblaufdatum_aktionszins(e.target.value)} />
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Referenzkonto / Auszahlungskonto</label>
                                    <input value={referenzkonto} onChange={(e) => setReferenzkonto(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Sparziel (€)</label>
                                    <input value={sparziel} onChange={(e) => setSparziel(e.target.value)} type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Sparrate (€/Monat)</label>
                                    <input value={sparrate} onChange={(e) => setSparrate(e.target.value)} type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Mindestbetrag (€)</label>
                                    <input value={mindestbetrag} onChange={(e) => setMindestbetrag(e.target.value)} type="number" />
                                </div>
                                <div className="form-group">
                                    <label>Einlagensicherung (€)</label>
                                    <input value={einlagensicherung} onChange={(e) => setEinlagensicherung(e.target.value)} type="number" />
                                </div>
                                <div className="form-group col-span-2">
                                    <label>Notizen</label>
                                    <input value={transaktionsNotizen} onChange={(e) => setTransaktionsNotizen(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Freistellingsauftrag</label>
                                    <input value={freistellungsauftrag} onChange={(e) => setFreistellungsauftrag(e.target.value)} />
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
                            <button className="btn-primary" onClick={tagesgeldkontoSpeichern}>Speichern</button>
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