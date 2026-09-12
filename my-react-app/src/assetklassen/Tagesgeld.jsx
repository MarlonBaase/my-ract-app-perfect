import { useEffect, useState, useContext } from "react";
import { SettingsContext } from '../SettingsContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    ladeTagesgeldKontoListe,
    ladeTransaktionenFuerTagesgeldAsset,
    ladeKategorien,
    ladeAssets,
    ladeReferenzkontenListe,
    tagesgeldkontoHinzufuegen,
    tagesgeldkontoSpeichern,
    transaktionHinzufuegen,
    assetLoeschenMitLog
} from '../services/tagesgeldService';

export default function Tagesgeld() {
    const [listeTagesgeld, setListeTagesgeld] = useState([]);
    const [name, setName] = useState("");
    const [bank, setBank] = useState("");
    const [iban, setIban] = useState("");
    const [kontoinhaber, setKontoinhaber] = useState("");
    const [ist_aktiv, setIstAktiv] = useState(true);
    const [bic, setBic] = useState("");
    const [zinssatz, setZinssatz] = useState("");
    const [einzahlung_bei_eroeffnung, setEinzahlung_bei_eroeffnung] = useState("");
    const [waehrung, setWaehrung] = useState("EUR");
    const [eroeffnungsdatum, setEroeffnungsdatum] = useState("");
    const [modalOffen, setModalOffen] = useState(false);
    const [modalOffenHinzu, setModalOffenHinzu] = useState(false);
    const [zuBearbeiten, setZuBearbeiten] = useState(null);
    const [modalOffenTransaktionen, setModalOffenTransaktionen] = useState(false);
    const [listeTransaktionenTagesgeld, setListeTransaktionenTagesgeld] = useState([]);
    const [modalTranskationenHinzufuegen, setModalTranskationenHinzufuegen] = useState(false);
    const [transaktionsNotizen, setTransaktionsNotizen] = useState("");
    const [transaktionsBetrag, setTransaktionsBetrag] = useState("");
    const [transaktionsKategorie, setTransaktionsKategorie] = useState("");
    const [transaktionsTyp, setTransaktionsTyp] = useState("");
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
    const [errors, setErrors] = useState({});
    const [notizen, setNotizen] = useState("");

    const { ansicht } = useContext(SettingsContext);

    const berechneZiel = (data) => {
        if (!data || data.length === 0) return;

        const notifyInfo = data.map(info => {
            const werte = Array.isArray(info.asset?.asset_name)
                ? info.asset.asset_name[0]
                : info.asset?.asset_name;

            const transaktionen = info.asset?.transaktionsprotokoll || [];

            const aktuellerKontostand = transaktionen.reduce((acc, t) => {
                const betrag = Number(t.betrag || 0);
                return t.typ === 'einnahme' ? acc + betrag : acc - betrag;
            }, 0);

            const zinssatzNum = Number(info.zinssatz || 0);
            const sparzielNum = Number(info.sparziel || 0);
            const sparrateNum = Number(info.sparrate || 0);

            const monatlicherZinssatz = (zinssatzNum / 100) * 12;
            const differenz = (sparzielNum - aktuellerKontostand) * monatlicherZinssatz;
            const aktuellerWert = sparrateNum + aktuellerKontostand * monatlicherZinssatz;

            let zielwert = "Unerreichbar";

            if (aktuellerKontostand >= sparzielNum) {
                zielwert = 0;
            } else if (monatlicherZinssatz > 0 && aktuellerWert > 0) {
                const oben = Math.log(1 + (differenz / aktuellerWert));
                const unten = Math.log(1 + monatlicherZinssatz);
                zielwert = oben / unten;
            } else if (sparrateNum > 0) {
                zielwert = (sparzielNum - aktuellerKontostand) / sparrateNum;
            }

            return {
                assetName: werte || "Unbekannt",
                zielwert: isFinite(zielwert) && zielwert >= 0 ? Math.ceil(zielwert) : "Unerreichbar",
            };
        });

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
    };

    const ladeDaten = async () => {
        const kontendaten = await ladeTagesgeldKontoListe();
        setListeTagesgeld(kontendaten);
        setListeTransaktionenTagesgeld(kontendaten);
        berechneZiel(kontendaten);
    };

    const transaktionenOeffnen = async (assetId) => {
        if (!assetId) {
            console.warn("Keine Asset-ID vorhanden!");
            return;
        }

        setModalOffenTransaktionen(true);
        setAusgewaehltesAsset(assetId);

        const txData = await ladeTransaktionenFuerTagesgeldAsset(assetId);
        setListeTransaktionenTagesgeld(txData);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) newErrors.name = "Asset Name ist erforderlich";
        if (!bank.trim()) newErrors.bank = "Bank Name ist erforderlich";
        if (!iban.trim()) newErrors.iban = "IBAN ist erforderlich";
        if (!waehrung.trim()) newErrors.waehrung = "Währung ist erforderlich";
        if (!eroeffnungsdatum) newErrors.eroeffnungsdatum = "Eröffnungsdatum ist erforderlich";
        if (!sparziel) newErrors.sparziel = "Sparziel ist erforderlich";
        if (!sparrate) newErrors.sparrate = "Sparrate ist erforderlich";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleTagesgeldkontoSpeichern = async () => {
        if (!validateForm()) return;

        const formData = {
            name, bank, iban, waehrung, zinssatz, zinssintervall,
            ausgewaehltesReferenzkonto, freistellungsauftrag, aktionszins,
            ablaufdatum_aktionszins, notgroschen, einlagensicherung, sparrate,
            sparziel, mindestbetrag, notizen, eroeffnungsdatum, kontoinhaber,
            bic, einzahlung_bei_eroeffnung, ist_referenzkonto, ist_aktiv
        };

        if (zuBearbeiten) {
            const success = await tagesgeldkontoSpeichern(zuBearbeiten.asset_id, formData);
            if (success) {
                setModalOffen(false);
                setZuBearbeiten(null);
                setErrors({});
                ladeDaten();
            }
        } else {
            const success = await tagesgeldkontoHinzufuegen(formData);
            if (success) {
                setName(""); setBank(""); setIban(""); setEinzahlung_bei_eroeffnung("");
                setWaehrung("EUR"); setEroeffnungsdatum(""); setNotizen("");
                setKontoinhaber(""); setIstAktiv(true); setBic(""); setZinssatz("");
                setModalOffenHinzu(false);
                setErrors({});
                ladeDaten();
            }
        }
    };

    const bearbeitenOeffnen = (eintrag) => {
        setZuBearbeiten(eintrag);
        setName(eintrag.asset?.asset_name || "");
        setBank(eintrag.name_der_bank || "");
        setIban(eintrag.iban || "");
        setEinzahlung_bei_eroeffnung(eintrag.einzahlung_bei_eroeffnung || "");
        setWaehrung(eintrag.waehrung || "EUR");
        setZinssatz(eintrag.zinssatz || "");
        setZinssintervall(eintrag.zinsintervall || "monatlich");
        setAusgewaehltesReferenzkonto(eintrag.referenzkonto || "");
        setFreistellungsauftrag(eintrag.freistellungsauftrag || "");
        setAktionszins(eintrag.aktionszins || "");
        setAblaufdatum_aktionszins(eintrag.ablaufdatum_aktionszins || null);
        setNotgroschen(eintrag.notgroschen || false);
        setEinlagensicherung(eintrag.einlagensicherung || "");
        setSparrate(eintrag.sparrate || "");
        setSparziel(eintrag.sparziel || "");
        setMindestbetrag(eintrag.mindestbetrag || "");
        setEroeffnungsdatum(eintrag.eroeffnungsdatum || "");
        setNotizen(eintrag.notizen || "");
        setKontoinhaber(eintrag.kontoinhaber || "");
        setIstAktiv(eintrag.ist_aktiv ?? true);
        setBic(eintrag.bic || "");
        setIstReferenzkonto(eintrag.ist_referenzkonto || false);
        setModalOffen(true);
    };

    const handleDelete = async (assetId) => {
        const success = await assetLoeschenMitLog(assetId, "tagesgeldkonto", "tagesgeldkonto");
        if (success) {
            ladeDaten();
        }
    };

    const handleAddTransaktion = async () => {
        if (!transaktionsNotizen || !transaktionsBetrag || !transaktionsKategorie || !transaktionsTyp) return;

        const success = await transaktionHinzufuegen({
            transaktionsNotizen,
            transaktionsBetrag,
            transaktionsKategorie,
            transaktionsTyp,
            ausgewaehltesAsset
        });

        if (success) {
            setTransaktionsNotizen("");
            setTransaktionsBetrag("");
            setTransaktionsKategorie("");
            setTransaktionsTyp("");
            setModalTranskationenHinzufuegen(false);
            ladeDaten();
            transaktionenOeffnen(ausgewaehltesAsset);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                await ladeDaten();
                const katData = await ladeKategorien();
                const refData = await ladeReferenzkontenListe();
                setKategorien(katData);
                setListeReferenzkonto(refData);
            } catch (err) {
                console.error("Fehler in init:", err);
            }
        };
        init();
    }, []);

    return (
        <div className="tagesgeldkonto-container">
            <ToastContainer />
            <div className="header-bar">
                <h2>Tagesgeld</h2>
                <button className="btn-primary" onClick={async () => {
                    const refData = await ladeReferenzkontenListe();
                    setListeReferenzkonto(refData);
                    setModalOffenHinzu(true);
                    setZuBearbeiten(null);
                    setName(""); setBank(""); setIban(""); setEinzahlung_bei_eroeffnung("");
                    setWaehrung("EUR"); setEroeffnungsdatum(""); setNotizen("");
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
                                    <p className="iban"><strong>IBAN:</strong> {e.iban}</p>
                                    {e.notizen && <p className="note">{e.notizen}</p>}
                                </div>

                                <div className="card-actions">
                                    <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                                    <button onClick={() => handleDelete(e.asset?.asset_id)} title="Löschen">🗑️</button>
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
                                const aktuellerKontostand = transaktionen.reduce((acc, t) => {
                                    const betrag = Number(t.betrag || 0);
                                    return t.typ === 'einnahme' ? acc + betrag : acc - betrag;
                                }, 0);

                                return (
                                    <tr key={e.id}>
                                        <td>
                                            <strong>{e.asset?.asset_name}</strong>
                                            <div className="subtext">{e.name_der_bank}</div>
                                        </td>
                                        <td className="code-text">{e.iban}</td>
                                        <td><strong>{aktuellerKontostand.toFixed(2)} {e.waehrung}</strong></td>
                                        <td>{e.kontoinhaber || "—"}</td>
                                        <td>{referenzkonto || "—"}</td>
                                        <td className="table-actions">
                                            <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
                                            <button onClick={() => handleDelete(e.asset?.asset_id)}>🗑️</button>
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

            {/* MODAL: Hinzufügen / Bearbeiten */}
            {(modalOffenHinzu || modalOffen) && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>{zuBearbeiten ? "Tagesgeldkonto bearbeiten" : "Neues Tagesgeldkonto hinzufügen"}</h3>
                            <button className="close-btn" onClick={() => { setModalOffenHinzu(false); setModalOffen(false); setErrors({}); }}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Asset Name*</label>
                                    <input
                                        className={errors.name ? "input-error" : ""}
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: null }); }}
                                        placeholder="z.B. Tagesgeld Flex"
                                    />
                                    {errors.name && <span className="error-text">{errors.name}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Bank Name*</label>
                                    <input
                                        className={errors.bank ? "input-error" : ""}
                                        value={bank}
                                        onChange={(e) => { setBank(e.target.value); setErrors({ ...errors, bank: null }); }}
                                        placeholder="z.B. Direktbank"
                                    />
                                    {errors.bank && <span className="error-text">{errors.bank}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => { setModalOffenHinzu(false); setModalOffen(false); setErrors({}); }}>Abbrechen</button>
                            <button className="btn-primary" onClick={handleTagesgeldkontoSpeichern}>Speichern</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}