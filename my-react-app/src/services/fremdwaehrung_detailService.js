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
    .order("erstellt_am", { ascending: true });

  if (handleApiError(error, "Diagrammdaten laden")) return [];
  return data || [];
}

/**
 * Wandelt Rohdaten aus der Datenbank in Diagramm-Punkte um (nach Zeitraum).
 */
export function erstelleDiagrammData(eintraege = [], zeitraum = "woche") {
  const jetzt = new Date();
  const punkte = [];

  if (zeitraum === "woche") {
    for (let i = 6; i >= 0; i--) {
      const tag = new Date();
      tag.setDate(jetzt.getDate() - i);

      const gefiltert = eintraege.filter((e) => {
        const d = new Date(e.erstellt_am);
        return (
          d.getDate() === tag.getDate() &&
          d.getMonth() === tag.getMonth() &&
          d.getFullYear() === tag.getFullYear()
        );
      });

      const kursWert = gefiltert.length > 0
        ? Number(gefiltert[gefiltert.length - 1].tageskurs_zu_eur)
        : null;

      punkte.push({ label: `${tag.getDate()}.`, kurs: kursWert });
    }
  } else if (zeitraum === "monat") {
    const tageImMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= tageImMonat; i++) {
      const gefiltert = eintraege.filter((e) => {
        const d = new Date(e.erstellt_am);
        return (
          d.getDate() === i &&
          d.getMonth() === jetzt.getMonth() &&
          d.getFullYear() === jetzt.getFullYear()
        );
      });

      const kursWert = gefiltert.length > 0
        ? Number(gefiltert[gefiltert.length - 1].tageskurs_zu_eur)
        : null;

      punkte.push({ label: `${i}.`, kurs: kursWert });
    }
  } else if (zeitraum === "jahr") {
    const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    for (let i = 0; i < 12; i++) {
      const gefiltert = eintraege.filter((e) => {
        const d = new Date(e.erstellt_am);
        return (
          d.getMonth() === i &&
          d.getFullYear() === jetzt.getFullYear()
        );
      });

      const kursWert = gefiltert.length > 0
        ? Number(gefiltert[gefiltert.length - 1].tageskurs_zu_eur)
        : null;

      punkte.push({ label: monate[i], kurs: kursWert });
    }
  }

  return punkte;
}