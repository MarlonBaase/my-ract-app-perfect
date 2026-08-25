import { useParams, Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function FremdwaehrungDetail() {

    const [tageskurs, setTageskurs] = useState("")
    const [vorletzterTageskurs, setVorletzterTageskurs] = useState("")
    const [aenderung, setAenderung] = useState("")
    const [diagrammDaten, setDiagrammDaten] = useState([]);
    const [zeitraum, setZeitraum] = useState("woche");
    const [eintraege, setEintraege] = useState([]);

    const { code } = useParams();
    const navigate = useNavigate();

    console.log(code)

    const ladeTageskurs = async () => {
        const { data, error } = await supabase
            .from("tageskurs")
            .select("tageskurs_zu_eur")
            .eq("waehrungs_code", code)
            .order('erstellt_am', { ascending: false })
            .limit(1)

        if (handleApiError(error, "Waehrung laden")) return;
        if (data) setTageskurs(data[0]);

        console.log(data)
    };

    const ladeVorletzterTageskurs = async () => {
        const { data, error } = await supabase
            .from("tageskurs")
            .select(`tageskurs_zu_eur`)
            .eq("waehrungs_code", code)
            .order('erstellt_am', { ascending: false })
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

        console.log(aenderung)

        setAenderung(aenderungRechnung)
    }

    const ladeDiagrammDaten = async () => {

        const { data, error } = await supabase
            .from("tageskurs")
            .select(`tageskurs_zu_eur`)
            .eq("waehrungs_code", code)
            .limit(5)

        if (handleApiError(error, "Waehrung laden")) return;
        if (data) setEintraege(data);

        const jetzt = new Date();
        const tag = new Date();
        let punkte = [];


        if (zeitraum === 'woche') {
            const diagrammDaten = eintraege
                .filter(e => new Date(e.erstellt_am).getDate() === tag.getDate() &&
                    new Date(e.erstellt_am).getMonth() === tag.getMonth());
            punkte.push({ label: `${tag.getDate()}.`, diagrammDaten });
        }

        if (zeitraum === 'monat') {
            const diagrammDaten = eintraege
                .filter(e => new Date(e.erstellt_am).getDate() &&
                    new Date(e.erstellt_am).getMonth() === jetzt.getMonth());
            punkte.push({ label: `${jetzt.getMonth()}.`, diagrammDaten });
        }

        if (zeitraum === 'jahr') {
            const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
            const diagrammDaten = eintraege
                .filter(e => new Date(e.erstellt_am).getMonth() &&
                    new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear());
            punkte.push({ label: `${jetzt.getFullYear()}`, diagrammDaten });
        }

        if (zeitraum === 'jahre') {
            const aktuellesJahr = jetzt.getFullYear();
            const startJahr = aktuellesJahr - 4;

            const diagrammDaten = eintraege
                .filter(e => {
                    const jahr = new Date(e.erstellt_am).getFullYear();
                    return jahr >= startJahr && jahr <= aktuellesJahr;
                });
            punkte.push({ label: `${jetzt.getFullYear()}`, diagrammDaten });
        }

        setDiagrammDaten(punkte)
    }

    useEffect(() => {
        const ladeAlleDaten = async () => {
            await ladeTageskurs();
            await ladeVorletzterTageskurs();
            await ladeDiagrammDaten();
            await ladeAenderung();
        };

        ladeAlleDaten();
    }, []);

    return (
        <div>
            <h2>Details für Währung: {code}</h2>

            <button onClick={() => navigate(`/assetklassen/lf/fremdwaehrung/fremdwaehrung_stammdaten/`)}> Zurück </button>

            {console.log("Tageskurs: " + tageskurs?.tageskurs_zu_eur)}

            <p>{tageskurs?.tageskurs_zu_eur}</p>
            <p>{aenderung?.aenderungRechnung}</p>




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