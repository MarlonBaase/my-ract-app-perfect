/**
 * Konfiguration und Meta-Daten für das Fremdwährungs-Layout.
 */
export const FREMDWAEHRUNG_LAYOUT_CONFIG = {
  title: "Fremdwährung",
};

/**
 * Hilfsfunktion für eventuelle Layout-relevante Prüfungen oder Datenaufrufe.
 */
export function getFremdwaehrungLayoutTitle() {
  return FREMDWAEHRUNG_LAYOUT_CONFIG.title;
}