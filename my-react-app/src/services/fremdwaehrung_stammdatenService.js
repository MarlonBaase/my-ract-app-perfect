import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";

/**
 * Lädt alle Währungsstammdaten aus der Datenbank.
 */
export async function ladeWaehrungen() {
  const { data, error } = await supabase
    .from("waehrungsstammdaten")
    .select("waehrungs_code, name, symbol");

  if (handleApiError(error, "Währung laden")) return [];
  return data || [];
}

/**
 * Filtert Währungseinträge anhand eines Suchbegriffs (Name oder Code).
 */
export function filterWaehrungen(listeWaehrung = [], searchTerm = "") {
  if (!searchTerm.trim()) return [];

  const search = searchTerm.toLowerCase();

  return listeWaehrung.filter((item) => {
    const name = String(item.name || "").toLowerCase();
    const code = String(item.waehrungs_code || "").toLowerCase();

    return name.includes(search) || code.includes(search);
  });
}

/**
 * Lädt den aktuellsten Tageskurs für einen bestimmten Währungscode.
 */
export async function fetchAktuellerTageskurs(searchTerm = "") {

  if (!searchTerm.trim()) return [];

  const search = searchTerm.toLowerCase();


  const { data, error } = await supabase
    .from("tageskurs")
    .select("tageskurs_zu_eur")
    .eq("waehrungs_code", search)
    .order("erstellt_am", { ascending: false })
    .limit(1);

  if (handleApiError(error, "Aktuellen Tageskurs laden")) return null;
  return data && data.length > 0 ? data[0] : null;
}