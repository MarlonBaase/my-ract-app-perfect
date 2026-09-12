/**
 * Konfiguration der Navigationsleiste für den Fremdwährungsbereich.
 */
export const NAV_STRUKTUR = [
  {
    label: 'Währungsstammdaten',
    path: '/assetklassen/lf/fremdwaehrung/fremdwaehrung_stammdaten',
    unterseiten: []
  },
  {
    label: 'Fremdwährungskonto',
    path: '/assetklassen/lf/fremdwaehrung/Fremdwaehrung_konto',
    unterseiten: []
  }
];

/**
 * Prüft, ob ein Pfad der aktuell aktive Pfad ist.
 * @param {string} currentPath - Der aktuelle Pfad der App (z.B. aus useLocation)
 * @param {string} targetPath - Der zu prüfende Zielpfad
 * @returns {boolean}
 */
export const checkIsActive = (currentPath, targetPath) => {
  if (!currentPath || !targetPath) return false;
  return currentPath.startsWith(targetPath);
};