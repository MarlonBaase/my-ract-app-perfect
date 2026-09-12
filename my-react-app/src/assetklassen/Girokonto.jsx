import { useEffect, useState, useContext } from "react";
import { SettingsContext } from '../SettingsContext';
import {
    ladeGirokonto,
    ladeAssets,
    ladeElternkontoListe,
    ladeKategorien,
    ladeTransaktionenFuerAsset,
    girokontoHinzufuegen,
    girokontoSpeichern,
    transaktionHinzufuegen,
    pruefeWiederkehren,
    assetLoeschenMitLog
} from '../services/girokontoService';

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

    const refreshGirokonten = async () => {
        const data = await ladeGirokonto();
        setListeGirokonto(data);
    };

    useEffect(() => {
        const init = async () => {
            try {
                await pruefeWiederkehren();
                const [assetData, kontoData, katData, elternData] = await Promise.all([
                    ladeAssets(),
                    ladeGirokonto(),
                    ladeKategorien(),
                    ladeElternkontoListe()
                ]);

                setAssets(assetData);
                setListeGirokonto(kontoData);
                setKategorien(katData);
                setElternkontoListe(elternData);
            } catch (err) {
                console.error("Fehler in init:", err);
            }
        };
        init();
    }, []);

    const transaktionenOeffnen = async (assetId) => {
        if (!assetId) {
            console.warn("Keine Asset-ID vorhanden!");
            return;
        }
        setAusgewaehltesAsset(assetId);
        const data = await ladeTransaktionenFuerAsset(assetId);
        setListeTransaktionenGirokonto(data);
        setModalOffenTransaktionen(true);
    };

    const resetForm = () => {
        setName(""); setBank(""); setIban(""); setEinzahlung_bei_eroeffnung("");
        setWaehrung("EUR"); setEroeffnungsdatum(""); setTransaktionsNotizen("");
        setKontoinhaber(""); setIstAktiv(true); setHauptkonto(false); setAusgewaehltesElternkonto("");
        setDispoLimit(""); setBic(""); setZinssatz(""); setIstReferenzkonto(false); setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = "Asset Name ist erforderlich";
        if (!bank.trim()) newErrors.bank = "Bank Name ist erforderlich";
        if (!iban.trim()) newErrors.iban = "IBAN ist erforderlich";
        if (!waehrung.trim()) newErrors.waehrung = "Währung ist erforderlich";
        if (!eroeffnungsdatum) newErrors.eroeffnungsdatum = "Eröffnungsdatum ist erforderlich";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGirokontoSpeichern = async () => {
        if (!validateForm()) return;

        const formData = {
            name, bank, iban, einzahlung_bei_eroeffnung, waehrung,
            eroeffnungsdatum, transaktionsNotizen, kontoinhaber, ist_aktiv,
            hauptkonto, ausgewaehltesElternkonto, dispo_limit, bic, zinssatz, ist_referenzkonto
        };

        if (zuBearbeiten) {
            const success = await girokontoSpeichern(zuBearbeiten.asset_id, formData);
            if (success) {
                setModalOffen(false);
                setZuBearbeiten(null);
                refreshGirokonten();
            }
        } else {
            const success = await girokontoHinzufuegen(formData);
            if (success) {
                setModalOffenHinzu(false);
                resetForm();
                refreshGirokonten();
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

    const handleDelete = async (assetId) => {
        const success = await assetLoeschenMitLog(assetId, "girokonto", "girokonto");
        if (success) {
            refreshGirokonten();
        }
    };

    const handleAddTransaktion = async () => {
        if (!transaktionsNotizen || !transaktionsBetrag || !transaktionsKategorie || !transaktionsTyp) return;

        const success = await transaktionHinzufuegen({
            transaktionsNotizen, transaktionsBetrag, transaktionsKategorie,
            transaktionsTyp, assetId: ausgewaehltesAsset, wiederkehrendaktiv, intervall
        });

        if (success) {
            setTransaktionsNotizen("");
            setTransaktionsBetrag("");
            setTransaktionsKategorie("");
            setTransaktionsTyp("");
            setWiederkehrendaktiv(false);
            setIntervall("");
            setModalTranskationenHinzufuegen(false);

            const updatedTx = await ladeTransaktionenFuerAsset(ausgewaehltesAsset);
            setListeTransaktionenGirokonto(updatedTx);
            refreshGirokonten();
        }
    };

    return (
        <div className="girokonto-container">
            <div className="header-bar">
                <h2>Girokonto</h2>
                <button className="btn-primary" onClick={() => {
                    resetForm();
                    setZuBearbeiten(null);
                    setModalOffenHinzu(true);
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
                                const aktuellerKontostand = transaktionen.reduce((acc, t) => {
                                    const betrag = Number(t.betrag || 0);
                                    return t.typ === 'einnahme' ? acc + betrag : acc - betrag;
                                }, 0);

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
                                        <td className="subtext">
                                            {Number(e.dispo_limit) > 0 && <div>Dispo: {e.dispo_limit} {e.waehrung}</div>}
                                            {Number(e.zinssatz) > 0 && <div>Zins: {e.zinssatz}%</div>}
                                            {!Number(e.dispo_limit) && !Number(e.zinssatz) && "—"}
                                        </td>
                                        <td>{e.kontoinhaber || "—"}</td>
                                        <td>{elternkontoName}</td>
                                        <td className="table-actions">
                                            <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                                            <button onClick={() => handleDelete(e.asset?.asset_id)} title="Löschen">🗑️</button>
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

            {/* MODAL: Hinzufügen / Bearbeiten */}
            {(modalOffenHinzu || modalOffen) && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>{zuBearbeiten ? "Girokonto bearbeiten" : "Neues Girokonto hinzufügen"}</h3>
                            <button className="close-btn" onClick={() => { setErrors({}); setModalOffenHinzu(false); setModalOffen(false); }}>✕</button>
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
                                        type="number"
                                        value={einzahlung_bei_eroeffnung}
                                        onChange={(e) => setEinzahlung_bei_eroeffnung(e.target.value)}
                                        placeholder="0.00"
                                    />
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
                                        type="date"
                                        className={errors.eroeffnungsdatum ? "input-error" : ""}
                                        value={eroeffnungsdatum}
                                        onChange={(e) => { setEroeffnungsdatum(e.target.value); setErrors({ ...errors, eroeffnungsdatum: null }); }}
                                    />
                                    {errors.eroeffnungsdatum && <span className="error-text">{errors.eroeffnungsdatum}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Kontoinhaber</label>
                                    <input
                                        value={kontoinhaber}
                                        onChange={(e) => setKontoinhaber(e.target.value)}
                                        placeholder="Max Mustermann"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>BIC</label>
                                    <input
                                        value={bic}
                                        onChange={(e) => setBic(e.target.value)}
                                        placeholder="BIC Code"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Dispo-Limit</label>
                                    <input
                                        type="number"
                                        value={dispo_limit}
                                        onChange={(e) => setDispoLimit(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Zinssatz (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={zinssatz}
                                        onChange={(e) => setZinssatz(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Elternkonto</label>
                                    <select
                                        value={ausgewaehltesElternkonto}
                                        onChange={(e) => setAusgewaehltesElternkonto(e.target.value)}
                                    >
                                        <option value="">Kein Elternkonto</option>
                                        {elternkontoListe.map((k) => (
                                            <option key={k.id} value={k.asset_id}>
                                                {k.name_der_bank} ({k.iban})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group col-span-2">
                                    <label>Notizen</label>
                                    <input
                                        value={transaktionsNotizen}
                                        onChange={(e) => setTransaktionsNotizen(e.target.value)}
                                        placeholder="Optionale Notizen..."
                                    />
                                </div>

                                <div className="form-group checkbox-group col-span-2">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={hauptkonto}
                                            onChange={(e) => setHauptkonto(e.target.checked)}
                                        />
                                        Hauptkonto
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={ist_referenzkonto}
                                            onChange={(e) => setIstReferenzkonto(e.target.checked)}
                                        />
                                        Referenzkonto
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={ist_aktiv}
                                            onChange={(e) => setIstAktiv(e.target.checked)}
                                        />
                                        Konto ist aktiv
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => { setErrors({}); setModalOffenHinzu(false); setModalOffen(false); }}>Abbrechen</button>
                            <button className="btn-primary" onClick={handleGirokontoSpeichern}>Speichern</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}