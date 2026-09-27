import { useEffect, useState } from "react";
import { getGirokontoLayoutTitle } from "../services/girokontoService";
import { ladeGirokonto, girokontoHinzufuegen } from "../services/girokonto_listeService";
import GirokontoListe from "./Girokonto_Liste";

export default function Girokonto() {
    const pageTitle = getGirokontoLayoutTitle();
    const [konten, setKonten] = useState([]);
    const [loading, setLoading] = useState(true);

    // Formular-States
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
            // Nach dem Speichern die Konten neu laden, damit die Liste erscheint
            const updatedData = await ladeGirokonto();
            setKonten(updatedData || []);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const kontoData = await ladeGirokonto();
                setKonten(kontoData || []);
            } catch (err) {
                console.error("Fehler beim Laden der Girokonten:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    if (loading) return <p>Lade Konten...</p>;

    return (
        <div className="girokonto-page">
            <h2>{pageTitle}</h2>

            {/* ENTWEDER: Keine Konten -> Ausgegrauter Bereich mit Button in der Mitte */}
            {konten.length === 0 ? (
                <div className="empty-state-container" style={{ 
                    opacity: 0.4, 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    height: "60vh",
                    textAlign: "center" 
                }}>
                    <h3>Kein Girokonto vorhanden</h3>
                    <p>Lege dein erstes Konto an, um die Übersicht zu aktivieren.</p>
                    <button className="btn-primary" style={{ opacity: 1, marginTop: "20px" }} onClick={() => {
                        resetForm();
                        setZuBearbeiten(null);
                        setModalOffenHinzu(true);
                    }}>
                        ➕ Girokonto hinzufügen
                    </button>
                </div>
            ) : (
                /* ODER: Konten vorhanden -> Zeige den Inhalt deiner girokonto_liste Datei */
                <GirokontoListe konten={konten} onAddClick={() => {
                    resetForm();
                    setZuBearbeiten(null);
                    setModalOffenHinzu(true);
                }} />
            )}

            {/* MODAL zum Hinzufügen (immer erreichbar) */}
            {modalOffenHinzu && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>{zuBearbeiten ? "Girokonto bearbeiten" : "Neues Girokonto hinzufügen"}</h3>
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
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => { setErrors({}); setModalOffenHinzu(false); }}>Abbrechen</button>
                            <button className="btn-primary" onClick={handleGirokontoSpeichern}>Speichern</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}