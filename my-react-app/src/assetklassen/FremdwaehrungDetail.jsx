import { useParams, Outlet, Link } from 'react-router-dom';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

export default function FremdwaehrungDetail() {

    const [tageskurs, setTageskurs] = useState("")
    const [vorletzterTageskurs, setVorletzterTageskurs] = useState("")
    const [aenderung, setAenderung] = useState("")
    const [diagrammDaten, setDiagrammDaten] = useState([]);
    const [zeitraum, setZeitraum] = useState("woche");

    const { code } = useParams(); // 'code' enthält jetzt z. B. "USD"
    const navigate = useNavigate();

    const ladeTageskurs = async () => {
        const { data, error } = await supabase
            .from("tageskurs")
            .select(`tageskurs_zu_eur`)
            .eq("waehrungs_code", code)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (handleApiError(error, "Waehrung laden")) return;
        if (data) setTageskurs(data);
    };

    const ladeVorletzterTageskurs = async () => {
        const { data, error } = await supabase
            .from("tageskurs")
            .select(`tageskurs_zu_eur`)
            .eq("waehrungs_code", code)
            .order('created_at', { ascending: false })
            .limit(2)

        if (handleApiError(error, "Waehrung laden")) return;

        if (error) {
            console.error('Fehler:', error.message);
        } else if (data && data.length >= 2) {
            setVorletzterTageskurs(data[1]);
        }
    };

    const ladeAenderung = async () => {
        var aenderungRechnung = tageskurs - vorletzterTageskurs

        setAenderung(aenderungRechnung)
    }

    const ladeDiagrammDaten = async () => {

        const { data, error } = await supabase
            .from("tageskurs")
            .select(`tageskurs_zu_eur`)
            .eq("waehrungs_code", code)
            .limit(5)
            .single();

        if (handleApiError(error, "Waehrung laden")) return;
        if (data) setDiagrammDaten(data);

        const jetzt = new Date();
        const tag = new Date();


        if (zeitraum === 'woche') {
            const eintraege = diagrammDaten
                .filter(e => new Date(e.erstellt_am).getDate() === tag.getDate() &&
                    new Date(e.erstellt_am).getMonth() === tag.getMonth())
        }

        if (zeitraum === 'monat') {
            const tageImMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate();
            const eintraege = diagrammDaten
                .filter(e => new Date(e.erstellt_am).getDate() === i &&
                    new Date(e.erstellt_am).getMonth() === jetzt.getMonth())
        }

        if (zeitraum === 'jahr') {
            const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
            const eintraege = diagrammDaten
                .filter(e => new Date(e.erstellt_am).getMonth() === i &&
                    new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear())
        }

        if (zeitraum === 'jahre') {
            const aktuellesJahr = jetzt.getFullYear();
            const startJahr = aktuellesJahr - 4;

            const eintraege = diagrammDaten.filter(e => {
                const jahr = new Date(e.erstellt_am).getFullYear();
                return jahr >= startJahr && jahr <= aktuellesJahr;
            });
        }
    }

    useEffect(() => {
        ladeTageskurs();
        ladeVorletzterTageskurs();
        ladeAenderung();
        ladeDiagrammDaten();
    }, [eintraege]);

    return (
        <div>
            <h2>Details für Währung: {code}</h2>

            <button onClick={() => navigate(`/assetklassen/lf/fremdwaehrung/fremdwaehrung_stammdaten/`)}> Zurück </button>

            <p>{tageskurs}</p>
            <p>{aenderung}</p>

            


            {/* --- 2. DIAGRAMME-GRID --- */}
            <div className="diagramme">
                {/* Liniendiagramm */}
                <div className="diagramm">
                    <LineChart width={400} height={200} data={diagrammDaten}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="einnahmen" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                </div>
                <div className="zeitraum">
                    <button className={zeitraum === "woche" ? "active" : ""} onClick={() => setZeitraum("wocher")}>1 Woche</button>
                    <button className={zeitraum === "monat" ? "active" : ""} onClick={() => setZeitraum("monat")}>1 Monat</button>
                    <button className={zeitraum === "jahr" ? "active" : ""} onClick={() => setZeitraum("jahr")}>1 Jahr</button>
                    <button className={zeitraum === "jahre" ? "active" : ""} onClick={() => setZeitraum("jahre")}>5 Jahre / max</button>
                </div>



            </div >
            <Outlet />
        </div>
    );
}