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
  const jetzt = new Date();
  let punkte = [];
  
   if (zeitraum === "woche") {
    for (let i = 6; i >= 0; i--) {
      const tag = new Date();
      tag.setDate(jetzt.getDate() - i);
      const eintrage = eintraege
        .filter(e => new Date(e.erstellt_am).getDate() === tag.getDate() &&
          new Date(e.erstellt_am).getMonth() === tag.getMonth());
      punkte.push({ label: `${tag.getDate()}.`, eintrage });
    }
   }

   if (zeitraum === "monat") {
    const tageImMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= tageImMonat; i++) {
      const eintrage = eintraege
        .filter(e => new Date(e.erstellt_am).getDate() === i &&
          new Date(e.erstellt_am).getMonth() === jetzt.getMonth());
      punkte.push({ label: `${i}.`, eintrage });
    }
   }

   if (zeitraum === "jahr") {
    const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    for (let i = 0; i < 12; i++) {
      const eintrage = eintraege
        .filter(e => new Date(e.erstellt_am).getMonth() === i &&
          new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear());
      punkte.push({ label: monate[i], eintrage });
    }
   }
  return punkte;
}