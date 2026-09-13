import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";

/**
 * Lädt den aktuellsten Tageskurs für einen bestimmten Währungscode.
 */
export async function fetchAktuellerTageskurs(code) {
  const { data, error } = await supabase
    .from("tageskurs")
    .select("tageskurs_zu_eur")
    .eq("waehrungs_code", code)
    .order("erstellt_am", { ascending: false })
    .limit(1);

  if (handleApiError(error, "Aktuellen Tageskurs laden")) return null;
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Lädt die letzten zwei Tageskurse, um den vorletzten Kurs für die Differenzberechnung zu ermitteln.
 */
export async function fetchVorletzterTageskurs(code) {
  const { data, error } = await supabase
    .from("tageskurs")
    .select("tageskurs_zu_eur")
    .eq("waehrungs_code", code)
    .order("erstellt_am", { ascending: false })
    .limit(2);

  if (handleApiError(error, "Vorletzten Tageskurs laden")) return null;
  return data && data.length >= 2 ? data[1] : null;
}

/**
 * Lädt alle historischen Einträge einer Währung aufsteigend für das Diagramm.
 */
export async function fetchTageskursHistorie(code) {
  const { data, error } = await supabase
    .from("tageskurs")
    .select("tageskurs_zu_eur, erstellt_am")
    .eq("waehrungs_code", code)
    .order("erstellt_am", { ascending: false });

  if (handleApiError(error, "Diagrammdaten laden")) return [];

  const alle = [
    ...(data ?? []).map((e) => ({ ...e, typ: "tageskurs" })),
  ].sort((a, b) => new Date(a.erstellt_am) - new Date(b.erstellt_am));
  return alle;
}

/**
 * Wandelt Rohdaten aus der Datenbank in Diagramm-Punkte um (nach Zeitraum).
 */
export function erstelleDiagrammData(eintraege, zeitraum) {
  console.log(eintraege, zeitraum);

  const jetzt = new Date();
  let punkte = [];

  // Hilfsfunktion, um ein Datum in "YYYY-MM-DD" (lokal) umzuwandeln
  const formatYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (zeitraum === "woche") {
    let letzterGueltigerWert = null;

    for (let i = 6; i >= 0; i--) {
      const tag = new Date();
      tag.setDate(jetzt.getDate() - i);
      const tagString = formatYMD(tag);

      const werte = eintraege.filter(e => {
        const eDatum = new Date(e.erstellt_am);
        return formatYMD(eDatum) === tagString;
      });

      if (werte.length > 0) {
        letzterGueltigerWert = werte[0].tageskurs_zu_eur;
      }

      punkte.push({
        label: `${tag.getDate()}.`,
        werte: letzterGueltigerWert
      });
    }
  }

  if (zeitraum === "monat") {
    const tageImMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate();
    let letzterGueltigerWert = null;

    for (let i = 1; i <= tageImMonat; i++) {
      // Datum für den jeweiligen Monatstag zusammenbauen
      const tag = new Date(jetzt.getFullYear(), jetzt.getMonth(), i);
      const tagString = formatYMD(tag);

      const werte = eintraege.filter(e => {
        const eDatum = new Date(e.erstellt_am);
        return formatYMD(eDatum) === tagString;
      });

      if (werte.length > 0) {
        letzterGueltigerWert = werte[0].tageskurs_zu_eur;
      }

      punkte.push({
        label: `${i}.`,
        werte: letzterGueltigerWert
      });
    }
  }

  if (zeitraum === "jahr") {
    const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    for (let i = 0; i < 12; i++) {
      const werte = eintraege.filter(e => {
        const eDatum = new Date(e.erstellt_am);
        return eDatum.getMonth() === i && eDatum.getFullYear() === jetzt.getFullYear();
      });

      let durchschnitt = 0;
      if (werte.length > 0) {
        const summe = werte.reduce((sum, e) => sum + e.tageskurs_zu_eur, 0);
        durchschnitt = summe / werte.length;
      }
      punkte.push({ label: monate[i], werte: durchschnitt });
    }
  }

  return punkte;
}