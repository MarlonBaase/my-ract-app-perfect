import { useParams, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function FremdwaehrungDetail() {

    const [tageskurs, setTageskurs] = useState(null);
    const [vorletzterTageskurs, setVorletzterTageskurs] = useState(null);
    const [diagrammDaten, setDiagrammDaten] = useState([]);
    const [zeitraum, setZeitraum] = useState("woche");

    const { code } = useParams();
    const navigate = useNavigate();

    const ladeTageskurs = useCallback(async () => {
        const { data, error } = await supabase
            .from("tageskurs")
            .select("tageskurs_zu_eur")
            .eq("waehrungs_code", code)
            .order('erstellt_am', { ascending: false })
            .limit(1);

        if (handleApiError(error, "Waehrung laden")) return;
        if (data && data.length > 0) setTageskurs(data[0]);
    }, [code]);

    const ladeVorletzterTageskurs = useCallback(async () => {
        const { data, error } = await supabase
            .from("tageskurs")
            .select(`tageskurs_zu_eur`)
            .eq("waehrungs_code", code)
            .order('erstellt_am', { ascending: false })
            .limit(2);

        if (handleApiError(error, "Waehrung laden")) return;

        if (data && data.length >= 2) {
            setVorletzterTageskurs(data[1]);
        }
    }, [code]);

    const ladeDiagrammDaten = useCallback(async () => {
        const { data, error } = await supabase
            .from("tageskurs")
            .select(`tageskurs_zu_eur, erstellt_am`)
            .eq("waehrungs_code", code)
            .order('erstellt_am', { ascending: true });

        if (handleApiError(error, "Waehrung laden")) return [];
        return data || [];
    }, [code]);

    const ladeDiagramm = useCallback(async () => {
        const eintraege = await ladeDiagrammDaten();
        const jetzt = new Date();
        let punkte = [];

        if (zeitraum === "woche") {
            for (let i = 6; i >= 0; i--) {
                const stichtag = new Date();
                stichtag.setDate(jetzt.getDate() - i);

                const gefiltert = eintraege.filter(e => {
                    const d = new Date(e.erstellt_am);
                    return d.getDate() === stichtag.getDate() &&
                           d.getMonth() === stichtag.getMonth() &&
                           d.getFullYear() === stichtag.getFullYear();
                });

                const kursWert = gefiltert.length > 0 ? gefiltert[gefiltert.length - 1].tageskurs_zu_eur : null;
                punkte.push({ label: `${stichtag.getDate()}.${stichtag.getMonth() + 1}.`, kurs: kursWert });
            }
        }

        if (zeitraum === "monat") {
            const tageImMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= tageImMonat; i++) {
                const gefiltert = eintraege.filter(e => {
                    const d = new Date(e.erstellt_am);
                    return d.getDate() === i &&
                           d.getMonth() === jetzt.getMonth() &&
                           d.getFullYear() === jetzt.getFullYear();
                });

                const kursWert = gefiltert.length > 0 ? gefiltert[gefiltert.length - 1].tageskurs_zu_eur : null;
                punkte.push({ label: `${i}.`, kurs: kursWert });
            }
        }

        if (zeitraum === "jahr") {
            const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
            for (let i = 0; i < 12; i++) {
                const gefiltert = eintraege.filter(e => {
                    const d = new Date(e.erstellt_am);
                    return d.getMonth() === i && d.getFullYear() === jetzt.getFullYear();
                });

                const kursWert = gefiltert.length > 0 ? gefiltert[gefiltert.length - 1].tageskurs_zu_eur : null;
                punkte.push({ label: monate[i], kurs: kursWert });
            }
        }

        if (zeitraum === 'jahre') {
            const aktuellesJahr = jetzt.getFullYear();
            const startJahr = aktuellesJahr - 4;

            for (let i = 0; i < 5; i++) {
                const zielJahr = startJahr + i;
                const gefiltert = eintraege.filter(e => new Date(e.erstellt_am).getFullYear() === zielJahr);
                const kursWert = gefiltert.length > 0 ? gefiltert[gefiltert.length - 1].tageskurs_zu_eur : null;

                punkte.push({ label: `${zielJahr}`, kurs: kursWert });
            }
        }

        setDiagrammDaten(punkte);
    }, [zeitraum, ladeDiagrammDaten]);

    useEffect(() => {
        const ladeAlleDaten = async () => {
            await ladeTageskurs();
            await ladeVorletzterTageskurs();
            await ladeDiagramm();
        };

        ladeAlleDaten();
    }, [ladeTageskurs, ladeVorletzterTageskurs, ladeDiagramm]);

    const kursAktuell = tageskurs?.tageskurs_zu_eur;
    const kursAlt = vorletzterTageskurs?.tageskurs_zu_eur;
    
    const diff = (kursAktuell && kursAlt) ? (kursAktuell - kursAlt) : 0;
    const prozent = (kursAktuell && kursAlt) ? ((kursAktuell - kursAlt) / kursAlt) * 100 : 0;

    return (
        <div>
            <h2>Details für Währung: {code}</h2>

            <button onClick={() => navigate(`/assetklassen/lf/fremdwaehrung/fremdwaehrung_stammdaten/`)}> Zurück </button>

            <p>{kursAktuell ?? "Lade..."}</p>
            {kursAktuell && kursAlt && (
                <p>
                    Änderung: {diff.toFixed(4)} ({prozent.toFixed(4)}%)
                </p>
            )}

            <div className="diagramme">
                <div className="diagramm">
                    <LineChart width={400} height={200} data={diagrammDaten}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="kurs" stroke="#10b981" strokeWidth={2} connectNulls={true} />
                    </LineChart>
                </div>
                <div className="zeitraum">
                    <button className={zeitraum === "woche" ? "active" : ""} onClick={() => setZeitraum("woche")}>1 Woche</button>
                    <button className={zeitraum === "monat" ? "active" : ""} onClick={() => setZeitraum("monat")}>1 Monat</button>
                    <button className={zeitraum === "jahr" ? "active" : ""} onClick={() => setZeitraum("jahr")}>1 Jahr</button>
                    <button className={zeitraum === "jahre" ? "active" : ""} onClick={() => setZeitraum("jahre")}>5 Jahre / max</button>
                </div>
            </div>
            <Outlet />
        </div>
    );
}