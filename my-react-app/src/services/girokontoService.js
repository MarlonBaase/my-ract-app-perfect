/**
 * Konfiguration und Meta-Daten für das Fremdwährungs-Layout.
 */
export const GIROKONTO_LAYOUT_CONFIG = {
  title: "Girokonto",
};

/**
 * Hilfsfunktion für eventuelle Layout-relevante Prüfungen oder Datenaufrufe.
 */
export function getGirokontoLayoutTitle() {
  return GIROKONTO_LAYOUT_CONFIG.title;
}

import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";

