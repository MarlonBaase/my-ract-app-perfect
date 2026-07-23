import { useEffect, useState, useContext } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import { SettingsContext } from '../SettingsContext';

export default function Girokonto() {
    const [listeGirokonto, setListeGirokonto] = useState([])
    const [name, setName] = useState("")
    const [bank, setBank] = useState("")
    const [iban, setIban] = useState("")
    const [kontoinhaber, setKontoinhaber] = useState("")
    const [ist_aktiv, setIstAktiv] = useState(true)
    const [hauptkonto, setHauptkonto] = useState(false)
    const [elternkonto, setElternkonto] = useState("")
    const [elternkontoListe, setElternkontoListe] = useState([]);
    const [ausgewaehltesElternkonto, setAusgewaehltesElternkonto] = useState("");
    const [dispo_limit, setDispoLimit] = useState("")
    const [bic, setBic] = useState("")
    const [zinssatz, setZinssatz] = useState("")
    const [einzahlung_bei_eroeffnung, setEinzahlung_bei_eroeffnung] = useState("")
    const [waehrung, setWaehrung] = useState("EUR")
    const [eroeffnungsdatum, setEroeffnungsdatum] = useState("")
    const [modalOffen, setModalOffen] = useState(false)
    const [modalOffenHinzu, setModalOffenHinzu] = useState(false)
    const [zuBearbeiten, setZuBearbeiten] = useState(null)
    const [modalOffenTransaktionen, setModalOffenTransaktionen] = useState(false)
    const [listeTransaktionenGirokonto, setListeTransaktionenGirokonto] = useState([])
    const [modalTranskationenHinzufuegen, setModalTranskationenHinzufuegen] = useState(false);
    const [transaktionsNotizen, setTransaktionsNotizen] = useState("");
    const [transaktionsBetrag, setTransaktionsBetrag] = useState("");
    const [transaktionsKategorie, setTransaktionsKategorie] = useState("");
    const [transaktionsTyp, setTransaktionsTyp] = useState("");
    const [listeTransaktionsWerte , setListeTransaktionsWerte] = useState([]);
    const [wiederkehrendaktiv, setWiederkehrendaktiv] = useState(false);
    const [ausgewaehltesAsset, setAusgewaehltesAsset] = useState("");
    const [kategorien, setKategorien] = useState([]);
    const [intervall, setIntervall] = useState("");

    const { ansicht } = useContext(SettingsContext);

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

    const transaktionsWerte = async(assetId) => {
        const { data, error } = await supabase
            .from("transaktionsprotokoll")
            .select("betrag")
            .eq("asset_id", assetId);

    if (handleApiError(error, "Transaktionen öffnen")) return;
    if (data) setListeTransaktionsWerte(data)
}

const girokontoHinzufuegen = async () => {
    if (!name || !bank || !iban || !einzahlung_bei_eroeffnung || !waehrung || !eroeffnungsdatum) return

    try {
        const { data: { user } } = await supabase.auth.getUser()

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
                notizen: transaktionsNotizen,
                kontoinhaber: kontoinhaber,
                ist_aktiv: true,
                hauptkonto: hauptkonto,
                elternkonto: ausgewaehltesElternkonto || null,
                dispo_limit: parseFloat(dispo_limit) || 0,
                bic: bic,
                zinssatz: parseFloat(zinssatz) || 0
            })

        if (giroError) {
            console.error("Fehler beim Erstellen des Girokontos:", giroError)
            alert("Fehler beim Girokonto-Insert.")
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
        setHauptkonto(false)
        setAusgewaehltesElternkonto("")
        setDispoLimit("")
        setBic("")
        setZinssatz("")
        setModalOffenHinzu(false)

        ladeGirokonto()
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
    setEroeffnungsdatum(eintrag.eroeffnungsdatum || "")
    setTransaktionsNotizen(eintrag.notizen || "")
    setKontoinhaber(eintrag.kontoinhaber || "")
    setIstAktiv(eintrag.ist_aktiv ?? true)
    setHauptkonto(eintrag.hauptkonto ?? false)
    setAusgewaehltesElternkonto(eintrag.elternkonto || "")
    setDispoLimit(eintrag.dispo_limit || "")
    setBic(eintrag.bic || "")
    setZinssatz(eintrag.zinssatz || "")
    setModalOffen(true)
}

const eintragLoeschen = async (assetId) => {
    if (!assetId) return;

    const { error: giroError } = await supabase
        .from("girokonto")
        .delete()
        .eq("asset_id", assetId);

    if (handleApiError(giroError, "Girokonto löschen")) return;

    const { error: assetError } = await supabase
        .from("asset")
        .delete()
        .eq("asset_id", assetId);

    if (handleApiError(assetError, "Asset löschen")) return;

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
            notizen: transaktionsNotizen,
            kontoinhaber: kontoinhaber,
            ist_aktiv: ist_aktiv,
            hauptkonto: hauptkonto,
            elternkonto: ausgewaehltesElternkonto || null,
            dispo_limit: parseFloat(dispo_limit) || 0,
            bic: bic,
            zinssatz: parseFloat(zinssatz) || 0
        })
        .eq("asset_id", zuBearbeiten.asset_id);

    if (handleApiError(giroError, "Girokontodaten updaten")) return;

    setModalOffen(false)
    setZuBearbeiten(null)
    ladeGirokonto()
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
        assetklasse: "girokonto",
        typ: transaktionsTyp
    });

    if (handleApiError(error, "Transaktion hinzufügen")) return;

    setTransaktionsNotizen("");
    setTransaktionsBetrag("");
    setTransaktionsKategorie("");
    setTransaktionsTyp("");

    ladeGirokonto();
    transaktionenOeffnen(ausgewaehltesAsset);
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

    if (data) setElternkontoListe(data);
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
                    const summe = listeTransaktionsWerte.reduce((akkumulator, aktuellerWert) => { return akkumulator + Number(aktuellerWert.betrag || 0); }, 0);
                    const wert = einzahlung_bei_eroeffnung - summe;

                    return (
                        <div className="account-card" key={e.id}>
                            <div className="card-header">
                                <div>
                                    <h3>{e.asset?.asset_name}</h3>
                                    <span className="bank-name">{e.name_der_bank}</span>
                                </div>
                                {e.hauptkonto && <span className="badge">Hauptkonto</span>}
                            </div>

                            <div className="card-body">

                                <div className="amount">
                                    {listeTransaktionsWerte} 
                                    {wert.toFixed(2)}
                                    {e.einzahlung_bei_eroeffnung} {e.waehrung}
                                </div>
                                <p className="iban"><strong>IBAN:</strong> {e.iban}</p>
                                {elternkontoName && <p className="parent"><strong>Elternkonto:</strong> {elternkontoName}</p>}
                                {e.notizen && <p className="note">{e.notizen}</p>}
                            </div>

                            <div className="card-actions">
                                <button onClick={() => bearbeitenOeffnen(e)} title="Bearbeiten">✏️</button>
                                <button onClick={() => eintragLoeschen(e.asset?.asset_id)} title="Löschen">🗑️</button>
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
                            <th>Elternkonto</th>
                            <th>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listeGirokonto.map((e) => {
                            const gefundenerEintrag = listeGirokonto.find(k => k.asset?.asset_id === e.elternkonto);
                            const elternkontoName = gefundenerEintrag ? gefundenerEintrag.asset?.asset_name : "—";

                            return (
                                <tr key={e.id}>
                                    <td>
                                        <strong>{e.asset?.asset_name}</strong>
                                        <div className="subtext">{e.name_der_bank}</div>
                                    </td>
                                    <td className="code-text">{e.iban}</td>
                                    <td><strong>{e.einzahlung_bei_eroeffnung} {e.waehrung}</strong></td>
                                    <td>{e.kontoinhaber || "—"}</td>
                                    <td>{elternkontoName}</td>
                                    <td className="table-actions">
                                        <button onClick={() => bearbeitenOeffnen(e)}>✏️</button>
                                        <button onClick={() => eintragLoeschen(e.asset?.asset_id)}>🗑️</button>
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
                        <h3>Neues Girokonto hinzufügen</h3>
                        <button className="close-btn" onClick={() => setModalOffenHinzu(false)}>✕</button>
                    </div>
                    <div className="modal-body">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Asset Name*</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Hauptkonto" />
                            </div>
                            <div className="form-group">
                                <label>Bank Name*</label>
                                <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="z.B. Sparkasse" />
                            </div>
                            <div className="form-group col-span-2">
                                <label>IBAN*</label>
                                <input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="DE00 0000 0000 0000 0000 00" />
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
                        <button className="btn-secondary" onClick={() => setModalOffenHinzu(false)}>Abbrechen</button>
                        <button className="btn-primary" onClick={girokontoHinzufuegen}>Speichern</button>
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
                                <label>Kontoinhaber</label>
                                <input value={kontoinhaber} onChange={(e) => setKontoinhaber(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>BIC</label>
                                <input value={bic} onChange={(e) => setBic(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Dispo Limit</label>
                                <input value={dispo_limit} onChange={(e) => setDispoLimit(e.target.value)} type="number" />
                            </div>
                            <div className="form-group">
                                <label>Zinssatz (%)</label>
                                <input value={zinssatz} onChange={(e) => setZinssatz(e.target.value)} type="number" step="0.01" />
                            </div>
                            <div className="form-group col-span-2">
                                <label>notizen</label>
                                <input value={transaktionsNotizen} onChange={(e) => setTransaktionsNotizen(e.target.value)} />
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
                        <button className="btn-primary" onClick={girokontoSpeichern}>Speichern</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: Transaktion Hinzufügen */}
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
                                <label>Notizen*</label>
                                <input value={transaktionsNotizen} onChange={(e) => setTransaktionsNotizen(e.target.value)} placeholder="z.B. Gehalt, Supermarkt..." />
                            </div>
                            <div className="form-group">
                                <label>Betrag*</label>
                                <input value={transaktionsBetrag} onChange={(e) => setTransaktionsBetrag(e.target.value)} placeholder="0.00" type="number" step="0.01" />
                            </div>
                            <div className="form-group">
                                <label>Typ*</label>
                                <select value={transaktionsTyp} onChange={(e) => setTransaktionsTyp(e.target.value)}>
                                    <option value="">Typ wählen</option>
                                    <option value="ausgabe">Ausgabe</option>
                                    <option value="einnahme">Einnahme</option>
                                </select>
                            </div>
                            <div className="form-group col-span-2">
                                <label>Kategorie*</label>
                                <select value={transaktionsKategorie} onChange={(e) => setTransaktionsKategorie(e.target.value)}>
                                    <option value="">Kategorie wählen</option>
                                    {kategorien.map((k) => (
                                        <option key={k.id} value={k.id}>{k.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group checkbox-group col-span-2">
                                <label className="checkbox-label">
                                    <input type="checkbox" checked={wiederkehrendaktiv} onChange={(e) => setWiederkehrendaktiv(e.target.checked)} />
                                    Wiederkehrende Transaktion
                                </label>
                            </div>

                            {wiederkehrendaktiv && (
                                <div className="form-group col-span-2">
                                    <label>Intervall</label>
                                    <select value={intervall} onChange={(e) => setIntervall(e.target.value)}>
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