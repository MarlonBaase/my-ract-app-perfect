import { useParams, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { 
  fetchAktuellerTageskurs, 
  fetchVorletzterTageskurs, 
  fetchTageskursHistorie, 
  erstelleDiagrammData 
} from "../services/fremdwaehrung_detailService";

export default function FremdwaehrungDetail() {
  const [tageskurs, setTageskurs] = useState(null);
  const [vorletzterTageskurs, setVorletzterTageskurs] = useState(null);
  const [diagrammDaten, setDiagrammDaten] = useState([]);
  const [zeitraum, setZeitraum] = useState("woche");
  const [eintraege, setEintraege] = useState([]);

  const { code } = useParams();
  const navigate = useNavigate();

  // Daten vom Service abrufen
  const ladeDaten = useCallback(async () => {
    if (!code) return;
    
    const aktueller = await fetchAktuellerTageskurs(code);
    const vorletzter = await fetchVorletzterTageskurs(code);
    const historie = await fetchTageskursHistorie(code);

    setTageskurs(aktueller);
    setVorletzterTageskurs(vorletzter);
    setEintraege(historie);
  }, [code]);

  useEffect(() => {
    ladeDaten();
  }, [ladeDaten]);

  // Diagramm-Punkte neu berechnen, wenn sich Zeitraum oder Rohdaten ändern
  useEffect(() => {
    if (eintraege.length > 0) {
      const daten = erstelleDiagrammData(eintraege, zeitraum);
      setDiagrammDaten(daten);
    }
  }, [zeitraum, eintraege]);

  const kursAktuell = tageskurs?.tageskurs_zu_eur;
  const kursAlt = vorletzterTageskurs?.tageskurs_zu_eur;

  const diff = (kursAktuell && kursAlt) ? (kursAktuell - kursAlt) : 0;
  const prozent = (kursAktuell && kursAlt) ? ((kursAktuell - kursAlt) / kursAlt) * 100 : 0;

  return (
    <div>
      <h2>Details für Währung: {code}</h2>

      <button onClick={() => navigate('/assetklassen/lf/fremdwaehrung/fremdwaehrung_stammdaten/')}>
        Zurück
      </button>

      <p>{kursAktuell ?? "Lade..."}</p>
      {kursAktuell && kursAlt && (
        <p>
          Änderung: {diff.toFixed(4)} ({prozent.toFixed(4)}%)
        </p>
      )}

      <div className="diagramme">
        <div className="diagramm">
          <LineChart width={500} height={250} data={diagrammDaten}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="werte"
              stroke="#10b981"
              strokeWidth={2}
              connectNulls={true}
            />
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