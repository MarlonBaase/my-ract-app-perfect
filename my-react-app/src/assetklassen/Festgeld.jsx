import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
    ladeFestgeld, 
    ladeKategorien, 
    ladeAssets, 
    ladeReferenzkonto, 
    festgeldHinzufuegen, 
    festgeldSpeichern, 
    assetLoeschenMitLog,
    formatEuro 
} from "../services/festgeldService";

// Hilfsfunktion zur automatischen Berechnung des Enddatums (Faelligkeitsdatum) basierend auf Startdatum + Monaten
const berechneEnddatum = (startStr, monateStr) => {
    if (!startStr || !monateStr || isNaN(monateStr)) return "";
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return "";

    const monate = parseInt(monateStr, 10);
    start.setMonth(start.getMonth() + monate);

    const jahr = start.getFullYear();
    const monat = String(start.getMonth() + 1).padStart(2, '0');
    const tag = String(start.getDate()).padStart(2, '0');

    return `${jahr}-${monat}-${tag}`;
};

export default function Festgeld() {
    // State für Daten
    const [festgeldList, setFestgeldList] = useState([]);
    const [kategorien, setKategorien] = useState([]);
    const [assets, setAssets] = useState([]);
    const [listeReferenzkonto, setListeReferenzkonto] = useState([]);

    // State für Modals
    const [modalOffen, setModalOffen] = useState(false);
    const [modalOffenHinzu, setModalOffenHinzu] = useState(false);
    const [bearbeitenData, setBearbeitenData] = useState(null);

    // State für Formularfelder (passend zum Backend-Datenmodell)
    const [name, setName] = useState("");
    const [bank, setBank] = useState("");
    const [einzahlungBeiEroeffnung, setEinzahlungBeiEroeffnung] = useState("");
    const [zinssatz, setZinssatz] = useState("");
    const [laufzeitMonate, setLaufzeitMonate] = useState("");
    const [eroeffnungsdatum, setEroeffnungsdatum] = useState("");
    const [faelligkeitsdatum, setFaelligkeitsdatum] = useState("");
    const [gekuendigtAm, setGekuendigtAm] = useState("");
    const [zinsgutschrift, setZinsgutschrift] = useState("");
    const [zinseszins, setZinseszins] = useState(true);
    const [freistellungsauftrag, setFreistellungsauftrag] = useState("");
    const [ausgewaehltesReferenzkonto, setAusgewaehltesReferenzkonto] = useState("");
    const [automatischVerlaengern, setAutomatischVerlaengern] = useState(false);
    const [istAktiv, setIstAktiv] = useState(true);
    const [notizen, setNotizen] = useState("");
    const [iban, setIban] = useState("");
    const [bic, setBic] = useState("");
    const [kontoinhaber, setKontoinhaber] = useState("");

    // Automatische Fälligkeitsdatum-Berechnung bei Änderung von Eröffnungsdatum oder Laufzeit
    useEffect(() => {
        if (eroeffnungsdatum && laufzeitMonate) {
            const berechnet = berechneEnddatum(eroeffnungsdatum, laufzeitMonate);
            if (berechnet) {
                setFaelligkeitsdatum(berechnet);
            }
        }
    }, [eroeffnungsdatum, laufzeitMonate]);

    // Berechnete Summen für die Übersicht
    const gesamtanlage = festgeldList.reduce((sum, item) => sum + Number(item.einzahlung_bei_eroeffnung || 0), 0);
    const zinsertragGesamt = festgeldList.reduce((sum, item) => {
        const summe = Number(item.einzahlung_bei_eroeffnung || 0);
        const zins = Number(item.zinssatz || 0);
        const monate = Number(item.laufzeit_monate || 0);
        return sum + (summe * (zins / 100) * (monate / 12));
    }, 0);

    useEffect(() => {
        ladeDaten();
    }, []);

    const ladeDaten = async () => {
        try {
            const [festgelderRes, kategorienRes, assetsRes, referenzRes] = await Promise.all([
                ladeFestgeld(),
                ladeKategorien(),
                ladeAssets(),
                ladeReferenzkonto()
            ]);
            setFestgeldList(festgelderRes);
            setKategorien(kategorienRes);
            setAssets(assetsRes);
            setListeReferenzkonto(referenzRes);
        } catch (err) {
            console.error("Fehler beim Laden der Daten:", err);
            toast.error("Fehler beim Laden der Daten.");
        }
    };

    const bearbeitenOeffnen = (item) => {
        setBearbeitenData(item);
        setName(item.asset?.asset_name || item.name_der_bank || "");
        setBank(item.name_der_bank || "");
        setEinzahlungBeiEroeffnung(item.einzahlung_bei_eroeffnung || "");
        setZinssatz(item.zinssatz || "");
        setLaufzeitMonate(item.laufzeit_monate || "");
        setEroeffnungsdatum(item.eroeffnungsdatum || "");
        setFaelligkeitsdatum(item.faelligkeitsdatum || "");
        setGekuendigtAm(item.gekuendigt_am || "");
        setZinsgutschrift(item.zinsgutschrift || "");
        setZinseszins(item.zinseszins ?? true);
        setFreistellungsauftrag(item.freistellungsauftrag || "");
        setAusgewaehltesReferenzkonto(item.referenzkonto || "");
        setAutomatischVerlaengern(item.automatische_verlaengerung ?? false);
        setIstAktiv(item.ist_aktiv ?? true);
        setNotizen(item.notizen || "");
        setIban(item.iban || "");
        setBic(item.bic || "");
        setKontoinhaber(item.kontoinhaber || "");
        setModalOffen(true);
    };

    const loescheFestgeld = async (item) => {
        if (window.confirm("Möchten Sie dieses Festgeld wirklich löschen?")) {
            const erfolg = await assetLoeschenMitLog(item.asset_id, "festgeld", "festgeld");
            if (erfolg) {
                toast.success("Festgeld erfolgreich gelöscht.");
                ladeDaten();
            } else {
                toast.error("Fehler beim Löschen des Festgelds.");
            }
        }
    };

    const transaktionenOeffnen = (item) => {
        console.log("Transaktionen öffnen für:", item);
    };

    const resetFormular = () => {
        setName("");
        setBank("");
        setEinzahlungBeiEroeffnung("");
        setZinssatz("");
        setLaufzeitMonate("");
        setEroeffnungsdatum("");
        setFaelligkeitsdatum("");
        setGekuendigtAm("");
        setZinsgutschrift("");
        setZinseszins(true);
        setFreistellungsauftrag("");
        setAusgewaehltesReferenzkonto("");
        setAutomatischVerlaengern(false);
        setIstAktiv(true);
        setNotizen("");
        setIban("");
        setBic("");
        setKontoinhaber("");
        setBearbeitenData(null);
    };

    const speichereFestgeld = async () => {
        const formData = {
            name,
            bank,
            einzahlung_bei_eroeffnung,
            zinssatz,
            laufzeitMonate,
            eroeffnungsdatum,
            faelligkeitsdatum,
            gekuendigtAm,
            zinsgutschrift,
            zinseszins,
            freistellungsauftrag,
            ausgewaehltesReferenzkonto,
            automatischVerlaengern,
            ist_aktiv: istAktiv,
            notizen,
            iban,
            bic,
            kontoinhaber
        };

        let erfolg = false;
        if (bearbeitenData) {
            erfolg = await festgeldSpeichern(bearbeitenData.asset_id, formData);
            if (erfolg) toast.success("Festgeld aktualisiert.");
        } else {
            erfolg = await festgeldHinzufuegen(formData);
            if (erfolg) toast.success("Festgeld hinzugefügt.");
        }

        if (erfolg) {
            setModalOffen(false);
            setModalOffenHinzu(false);
            resetFormular();
            ladeDaten();
        } else {
            toast.error("Fehler beim Speichern.");
        }
    };

    return (
        <div className="festgeld-container p-6">
            <h1 className="text-2xl font-bold mb-4">Festgeld Übersicht</h1>

            {/* Übersichtskarten */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="card p-4 shadow rounded bg-white">
                    <h2 className="text-gray-500 font-medium">Gesamte Anlagesumme</h2>
                    <p className="text-2xl font-bold text-blue-600">{formatEuro(gesamtanlage)}</p>
                </div>
                <div className="card p-4 shadow rounded bg-white">
                    <h2 className="text-gray-500 font-medium">Erwarteter Zinsertrag</h2>
                    <p className="text-2xl font-bold text-green-600">{formatEuro(zinsertragGesamt)}</p>
                </div>
            </div>

            {/* Aktion-Buttons */}
            <div className="mb-4">
                <button 
                    className="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => { resetFormular(); setModalOffenHinzu(true); }}
                >
                    + Neues Festgeld anlegen
                </button>
            </div>

            {/* Liste / Tabelle */}
            <div className="table-responsive bg-white rounded shadow overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b bg-gray-100">
                            <th className="p-3">Name / Bank</th>
                            <th className="p-3">Anlagesumme</th>
                            <th className="p-3">Zinssatz</th>
                            <th className="p-3">Laufzeit</th>
                            <th className="p-3">Fälligkeitsdatum</th>
                            <th className="p-3 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {festgeldList.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-4 text-center text-gray-500">
                                    Keine Festgelder vorhanden.
                                </td>
                            </tr>
                        ) : (
                            festgeldList.map((item) => (
                                <tr key={item.asset_id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{item.asset?.asset_name || item.name_der_bank || "Unbenannt"}</td>
                                    <td className="p-3 font-semibold">{formatEuro(item.einzahlung_bei_eroeffnung)}</td>
                                    <td className="p-3">{item.zinssatz}%</td>
                                    <td className="p-3">{item.laufzeit_monate} Monate</td>
                                    <td className="p-3">{item.faelligkeitsdatum}</td>
                                    <td className="p-3 text-right space-x-2">
                                        <button 
                                            onClick={() => transaktionenOeffnen(item)}
                                            className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                            Transaktionen
                                        </button>
                                        <button 
                                            onClick={() => bearbeitenOeffnen(item)}
                                            className="px-2 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                        >
                                            Bearbeiten
                                        </button>
                                        <button 
                                            onClick={() => loescheFestgeld(item)}
                                            className="px-2 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                                        >
                                            Löschen
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal für Hinzufügen / Bearbeiten */}
            {(modalOffen || modalOffenHinzu) && (
                <div className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="modal-content bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="modal-header border-b pb-3 mb-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold">
                                {bearbeitenData ? "Festgeld bearbeiten" : "Neues Festgeld anlegen"}
                            </h3>
                            <button 
                                className="text-gray-500 hover:text-gray-700 font-bold"
                                onClick={() => { setModalOffen(false); setModalOffenHinzu(false); }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Bezeichnung / Name*</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded"
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="z.B. Festgeld Hausbank"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Name der Bank*</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded"
                                        value={bank} 
                                        onChange={(e) => setBank(e.target.value)} 
                                        placeholder="z.B. Commerzbank"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Anlagesumme (€)*</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded"
                                        value={einzahlungBeiEroeffnung} 
                                        onChange={(e) => setEinzahlungBeiEroeffnung(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Zinssatz (% p.a.)*</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        className="w-full border p-2 rounded"
                                        value={zinssatz} 
                                        onChange={(e) => setZinssatz(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Laufzeit (Monate)*</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded"
                                        value={laufzeitMonate} 
                                        onChange={(e) => setLaufzeitMonate(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Eröffnungsdatum</label>
                                    <input 
                                        type="date" 
                                        className="w-full border p-2 rounded"
                                        value={eroeffnungsdatum} 
                                        onChange={(e) => setEroeffnungsdatum(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">
                                        Fälligkeitsdatum <span className="text-xs text-gray-400 font-normal">(automatisch berechnet)</span>
                                    </label>
                                    <input 
                                        type="date" 
                                        className="w-full border p-2 rounded bg-gray-50"
                                        value={faelligkeitsdatum} 
                                        onChange={(e) => setFaelligkeitsdatum(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Zinsgutschrift</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded"
                                        value={zinsgutschrift} 
                                        onChange={(e) => setZinsgutschrift(e.target.value)} 
                                        placeholder="z.B. Jährlich / Am Ende"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Freistellungsauftrag (€)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded"
                                        value={freistellungsauftrag} 
                                        onChange={(e) => setFreistellungsauftrag(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">IBAN</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded"
                                        value={iban} 
                                        onChange={(e) => setIban(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">BIC</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded"
                                        value={bic} 
                                        onChange={(e) => setBic(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Kontoinhaber</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded"
                                        value={kontoinhaber} 
                                        onChange={(e) => setKontoinhaber(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Referenzkonto</label>
                                    <select 
                                        className="w-full border p-2 rounded"
                                        value={ausgewaehltesReferenzkonto} 
                                        onChange={(e) => setAusgewaehltesReferenzkonto(e.target.value)}
                                    >
                                        <option value="">Referenzkonto auswählen...</option>
                                        {listeReferenzkonto.map(konto => (
                                            <option key={konto.asset_id} value={konto.asset_id}>
                                                {konto.asset_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group checkbox-group col-span-1 md:col-span-2 flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="prolongation"
                                            checked={automatischVerlaengern}
                                            onChange={(e) => setAutomatischVerlaengern(e.target.checked)}
                                        />
                                        <label htmlFor="prolongation" className="text-sm font-medium">
                                            Automatisch verlängern
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="zinseszins"
                                            checked={zinseszins}
                                            onChange={(e) => setZinseszins(e.target.checked)}
                                        />
                                        <label htmlFor="zinseszins" className="text-sm font-medium">
                                            Zinseszins nutzen
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Notizen</label>
                                    <textarea
                                        className="w-full border p-2 rounded"
                                        value={notizen}
                                        onChange={(e) => setNotizen(e.target.value)}
                                        placeholder="Zusätzliche Anmerkungen..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer border-t pt-4 mt-6 flex justify-end gap-2">
                            <button 
                                className="btn-secondary px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" 
                                onClick={() => { setModalOffenHinzu(false); setModalOffen(false); }}
                            >
                                Abbrechen
                            </button>
                            <button 
                                className="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
                                onClick={speichereFestgeld}
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Container für Benachrichtigungen */}
            <ToastContainer />
        </div>
    );
}