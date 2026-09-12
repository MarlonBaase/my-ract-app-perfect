/**
 * Hauptmenü-Struktur für die Navigation
 */
export const NAV_STRUKTUR = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    unterseiten: [
      { label: 'Aktuelle Gesamtzahlen', path: '/dashboard/gesamtzahlen' },
      { label: 'Diagramme', path: '/dashboard/diagramme' },
      { label: 'Watchlist', path: '/dashboard/watchlist' },
    ]
  },
  {
    label: 'Haushaltsbuch',
    path: '/haushaltsbuch',
    unterseiten: [
      { label: 'Geldfluss', path: '/haushaltsbuch/geldfluss' },
      { label: 'Aktuelle Zahlen', path: '/haushaltsbuch/zahlen' },
      { label: 'Diagramme', path: '/haushaltsbuch/diagramme' },
    ]
  },
  {
    label: 'Assetklassen',
    path: '/assetklassen',
    unterseiten: [
      { label: 'Währungsstammdaten', path: '/assetklassen/lf/fremdwaehrung_stammaten' },
      { label: 'Fremdwährungskonten', path: '/assetklassen/lf/fremdwaehrung_konto' },
    ]
  },
  {
    label: 'Steuern & Risiko',
    path: '/steuern',
    unterseiten: [
      { label: 'Steuerverwaltung', path: '/steuern/verwaltung' },
      { label: 'Risikobewertung', path: '/steuern/risiko' },
    ]
  },
  {
    label: 'Simulation & Berechnung',
    path: '/simulation',
    unterseiten: [
      { label: 'Gesamtsimulationen', path: '/simulation/gesamt' },
      { label: 'Allgemeine Berechnungen', path: '/simulation/berechnungen' },
    ]
  },
  {
    label: 'Support',
    path: '/support',
    unterseiten: []
  },
  {
    label: 'Profil',
    path: '/profil',
    unterseiten: [
      { label: 'Einstellungen', path: '/profil/einstellungen' },
      { label: 'Konfiguration', path: '/profil/konfiguration' },
      { label: 'Zeiterfassung', path: '/profil/zeiterfassung' },
      { label: 'Admin-Support', path: '/profil/admin-support' }
    ]
  },
];

/**
 * Prüft, ob ein gegebener Pfad aktuell aktiv ist.
 */
export function istPfadAktiv(aktuellerPfad, zielPfad) {
  return aktuellerPfad.startsWith(zielPfad);
}