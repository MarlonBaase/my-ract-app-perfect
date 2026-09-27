import { Outlet } from 'react-router-dom';
import { useEffect, useState, useContext } from "react";
import { getGirokontoLayoutTitle } from '../services/girokontoService';
import { ladeGirokonto,girokontoHinzufuegen } from '../services/girokonto_listeService';

export default function Girokonto() {

    const pageTitle = getGirokontoLayoutTitle();
    const [konten, setKonten] = useState([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState("");
    const [bank, setBank] = useState("");
    const [iban, setIban] = useState("");
    const [kontoinhaber, setKontoinhaber] = useState("");
    const [ist_aktiv, setIstAktiv] = useState(true);
    const [hauptkonto, setHauptkonto] = useState(false);
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

    const [transaktionsNotizen, setTransaktionsNotizen] = useState("");
    const [ist_referenzkonto, setIstReferenzkonto] = useState(false);
    const [errors, setErrors] = useState({});


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

        const success = await girokontoHinzufuegen(formData);
        if (success) {
            setModalOffenHinzu(false);
            resetForm();
        }
    }


useEffect(() => {
    const init = async () => {
        try {
            const [kontoData] = await Promise.all([
                ladeGirokonto()
            ]);
            setKonten(kontoData);
        } catch (err) {
            console.error("Fehler in init:", err);
        }
    };
    init();
}, []);


if (loading) return <p>Lade Konten...</p>;

if (konten.length === 0) {
    return (
        <div className="empty-state-container" style={{ opacity: 0.5, textAlign: "center", padding: "50px" }}>
            <h2>Kein Girokonto vorhanden</h2>
            <p>Du hast noch kein Girokonto angelegt. Lege jetzt dein erstes Konto an, um zu starten.</p>
            <button className="btn-primary" onClick={() => {
                resetForm();
                setZuBearbeiten(null);
                setModalOffenHinzu(true);
            }}>
                ➕ Girokonto hinzufügen
            </button>

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

return (
    <div>
        <h2>{pageTitle}</h2>

        <Outlet />
    </div>

);
}

