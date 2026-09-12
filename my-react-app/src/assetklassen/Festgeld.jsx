import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Hilfsfunktion zur Formatierung von Euro-Beträgen
const formatEuro = (val) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val || 0);
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

    // State für Formularfelder
    const [ausgewaehltesAsset, setAusgewaehltesAsset] = useState("");
    const [ausgewaehlteKategorie, setAusgewaehlteKategorie] = useState("");
    const [anlagesumme, setAnlagesumme] = useState("");
    const [zinssatz, setZinssatz] = useState("");
    const [laufzeitMonate, setLaufzeitMonate] = useState("");
    const [startdatum, setStartdatum] = useState("");
    const [enddatum, setEnddatum] = useState("");
    const [ausgewaehltesReferenzkonto, setAusgewaehltesReferenzkonto] = useState("");
    const [automatischVerlaengern, setAutomatischVerlaengern] = useState(false);
    const [notizen, setNotizen] = useState("");

    // Berechnete Summen für die Übersicht
    const gesamtanlage = festgeldList.reduce((sum, item) => sum + Number(item.anlagesumme || 0), 0);
    const zinsertragGesamt = festgeldList.reduce((sum, item) => sum + Number(item.zinsertrag || 0), 0);

    useEffect(() => {
        ladeFestgeld();
        ladeKategorien();
        ladeAssets();
        ladeReferenzkonto();
    }, []);

    const ladeFestgeld = async () => {
        try {
            const res = await axios.get("/api/festgeld");
            setFestgeldList(res.data || []);
        } catch (err) {
            console.error("Fehler beim Laden der Festgelder:", err);
        }
    };

    const ladeKategorien = async () => {
        try {
            const res = await axios.get("/api/kategorien");
            setKategorien(res.data || []);
        } catch (err) {
            console.error("Fehler beim Laden der Kategorien:", err);
        }
    };

    const ladeAssets = async () => {
        try {
            const res = await axios.get("/api/assets");
            setAssets(res.data || []);
        } catch (err) {
            console.error("Fehler beim Laden der Assets:", err);
        }
    };

    const ladeReferenzkonto = async () => {
        try {
            const res = await axios.get("/api/referenzkonten");
            setListeReferenzkonto(res.data || []);
        } catch (err) {
            console.error("Fehler beim Laden der Referenzkonten:", err);
        }
    };

    const bearbeitenOeffnen = (item) => {
        setBearbeitenData(item);
        setAusgewaehltesAsset(item.asset_id || "");
        setAusgewaehlteKategorie(item.kategorie_id || "");
        setAnlagesumme(item.anlagesumme || "");
        setZinssatz(item.zinssatz || "");
        setLaufzeitMonate(item.laufzeit_monate || "");
        setStartdatum(item.startdatum || "");
        setEnddatum(item.enddatum || "");
        setAusgewaehltesReferenzkonto(item.referenzkonto_id || "");
        setAutomatischVerlaengern(item.automatisch_verlaengern || false);
        setNotizen(item.notizen || "");
        setModalOffen(true);
    };

    const assetLoeschenMitLog = async (id) => {
        if (window.confirm("Möchten Sie dieses Festgeld wirklich löschen?")) {
            try {
                await axios.delete(`/api/festgeld/${id}`);
                toast.success("Festgeld erfolgreich gelöscht.");
                ladeFestgeld();
            } catch (err) {
                toast.error("Fehler beim Löschen des Festgelds.");
            }
        }
    };

    const transaktionenOeffnen = (item) => {
        console.log("Transaktionen öffnen für:", item);
    };

    const resetFormular = () => {
        setAusgewaehltesAsset("");
        setAusgewaehlteKategorie("");
        setAnlagesumme("");
        setZinssatz("");
        setLaufzeitMonate("");
        setStartdatum("");
        setEnddatum("");
        setAusgewaehltesReferenzkonto("");
        setAutomatischVerlaengern(false);
        setNotizen("");
        setBearbeitenData(null);
    };

    const speichereFestgeld = async () => {
        const payload = {
            asset_id: ausgewaehltesAsset,
            kategorie_id: ausgewaehlteKategorie,
            anlagesumme: Number(anlagesumme),
            zinssatz: Number(zinssatz),
            laufzeit_monate: Number(laufzeitMonate),
            startdatum,
            enddatum,
            referenzkonto_id: ausgewaehltesReferenzkonto,
            automatisch_verlaengern: automatischVerlaengern,
            notizen
        };

        try {
            if (bearbeitenData) {
                await axios.put(`/api/festgeld/${bearbeitenData.id}`, payload);
                toast.success("Festgeld aktualisiert.");
            } else {
                await axios.post("/api/festgeld", payload);
                toast.success("Festgeld hinzugefügt.");
            }
            setModalOffen(false);
            setModalOffenHinzu(false);
            resetFormular();
            ladeFestgeld();
        } catch (err) {
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
                            <th className="p-3">Asset</th>
                            <th className="p-3">Anlagesumme</th>
                            <th className="p-3">Zinssatz</th>
                            <th className="p-3">Laufzeit</th>
                            <th className="p-3">Enddatum</th>
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
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{item.asset_name || "Unbenannt"}</td>
                                    <td className="p-3 font-semibold">{formatEuro(item.anlagesumme)}</td>
                                    <td className="p-3">{item.zinssatz}%</td>
                                    <td className="p-3">{item.laufzeit_monate} Monate</td>
                                    <td className="p-3">{item.enddatum}</td>
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
                                            onClick={() => assetLoeschenMitLog(item.id)}
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
                                    <label className="block text-sm font-medium mb-1">Asset / Name*</label>
                                    <select 
                                        className="w-full border p-2 rounded"
                                        value={ausgewaehltesAsset} 
                                        onChange={(e) => setAusgewaehltesAsset(e.target.value)}
                                    >
                                        <option value="">Asset auswählen...</option>
                                        {assets.map(asset => (
                                            <option key={asset.id} value={asset.id}>
                                                {asset.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Kategorie</label>
                                    <select 
                                        className="w-full border p-2 rounded"
                                        value={ausgewaehlteKategorie} 
                                        onChange={(e) => setAusgewaehlteKategorie(e.target.value)}
                                    >
                                        <option value="">Kategorie auswählen...</option>
                                        {kategorien.map(kat => (
                                            <option key={kat.id} value={kat.id}>
                                                {kat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Anlagesumme (€)*</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded"
                                        value={anlagesumme} 
                                        onChange={(e) => setAnlagesumme(e.target.value)} 
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
                                    <label className="block text-sm font-medium mb-1">Startdatum</label>
                                    <input 
                                        type="date" 
                                        className="w-full border p-2 rounded"
                                        value={startdatum} 
                                        onChange={(e) => setStartdatum(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium mb-1">Enddatum</label>
                                    <input 
                                        type="date" 
                                        className="w-full border p-2 rounded"
                                        value={enddatum} 
                                        onChange={(e) => setEnddatum(e.target.value)} 
                                    />
                                </div>

                                <div className="form-group col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Referenzkonto / Auszahlungskonto*</label>
                                    <select 
                                        className="w-full border p-2 rounded"
                                        value={ausgewaehltesReferenzkonto} 
                                        onChange={(e) => setAusgewaehltesReferenzkonto(e.target.value)}
                                    >
                                        <option value="">Referenzkonto auswählen...</option>
                                        {listeReferenzkonto.map(konto => (
                                            <option key={konto.id} value={konto.id}>
                                                {konto.girokonto
                                                    ? `Girokonto (${konto.girokonto.iban || konto.asset_name || ''})`
                                                    : `Tagesgeld (${konto.tagesgeldkonto?.iban || konto.asset_name || ''})`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group checkbox-group col-span-1 md:col-span-2 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="prolongation"
                                        checked={automatischVerlaengern}
                                        onChange={(e) => setAutomatischVerlaengern(e.target.checked)}
                                    />
                                    <label htmlFor="prolongation" className="text-sm font-medium">
                                        Automatisch verlängern (Prolongation)
                                    </label>
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