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


    const ladeDiagrammDaten = async () => {

        const { data, error } = await supabase
            .from("tageskurs")
            .select(`tageskurs_zu_eur, erstellt_am`)
            .eq("waehrungs_code", code)

        if (handleApiError(error, "Waehrung laden")) return;
        if (data) setEintraege(data);

        return data || [];

    }


    const ladeDiagramm = async () => {

        ladeDiagrammDaten();

        const jetzt = new Date();
        const tag = new Date();
        let punkte = [];


        if (zeitraum === "woche") {
            for (let i = 6; i >= 0; i--) {
                const tag = new Date();
                tag.setDate(jetzt.getDate() - i);
                const diagrammDaten = eintraege[0]
                    .filter(e =>new Date(e.erstellt_am).getDate() === tag.getDate() &&
                        new Date(e.erstellt_am).getMonth() === tag.getMonth())
                punkte.push({ label: `${tag.getDate()}.`, diagrammDaten });
            }
        }

        if (zeitraum === "monat") {
            const tageImMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= tageImMonat; i++) {
                const diagrammDaten = eintraege[0]
                    .filter(e => new Date(e.erstellt_am).getDate() === i &&
                        new Date(e.erstellt_am).getMonth() === jetzt.getMonth());
                punkte.push({ label: `${i}.`, diagrammDaten });
            }
        }

        if (zeitraum === "jahr") {
            const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
            for (let i = 0; i < 12; i++) {
                const diagrammDaten = eintraege[0]
                    .filter(e => new Date(e.erstellt_am).getMonth() === i &&
                        new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear())
                punkte.push({ label: monate[i], diagrammDaten });
            }
        }

        if (zeitraum === 'jahre') {
            const aktuellesJahr = jetzt.getFullYear();
            const startJahr = aktuellesJahr - 4;


            for (let i = 0; i < 5; i++) {
                const diagrammDaten = eintraege[0]
                    .filter(e => {const jahr = new Date(e.erstellt_am).getFullYear();
                    return jahr === startJahr + i})
                punkte.push({ label: i, diagrammDaten });
            }
        }

        setDiagrammDaten(punkte)
    }

    useEffect(() => {
        const ladeAlleDaten = async () => {
            await ladeTageskurs();
            await ladeVorletzterTageskurs();
            await ladeDiagramm();
        };

        ladeAlleDaten();
    }, []);

    return (
        <div>
            <h2>Details für Währung: {code}</h2>

            <button onClick={() => navigate(`/assetklassen/lf/fremdwaehrung/fremdwaehrung_stammdaten/`)}> Zurück </button>

            {console.log("Tageskurs: " + tageskurs?.tageskurs_zu_eur)}

            <p>{tageskurs?.tageskurs_zu_eur}</p>
            <p>Änderung: {(tageskurs?.tageskurs_zu_eur - vorletzterTageskurs?.tageskurs_zu_eur).toFixed(4)} {((tageskurs?.tageskurs_zu_eur - vorletzterTageskurs?.tageskurs_zu_eur) / 100).toFixed(4)}%</p>




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