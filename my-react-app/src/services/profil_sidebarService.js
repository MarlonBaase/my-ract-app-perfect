/**
 * Struktur-Konfiguration für die Profil-Sidebar.
 */
export const PROFIL_SIDEBAR_STRUKTUR = [
  {
    block: "Profil",
    farbe: "#22C55E",
    bereiche: [
      {
        label: "Daten",
        path: "/profil/daten",
        unterseiten: []
      },
    ]
  },
  {
    block: "Einstellungen",
    farbe: "#c54522",
    bereiche: [
      {
        label: "Einstellungen",
        path: "/profil/konfiguration",
        unterseiten: []
      },
    ]
  },
  {
    block: "Zeiterfassung",
    farbe: "#2e2bc0",
    bereiche: [
      {
        label: "Zeiterfassung",
        path: "/profil/zeiterfassung",
        unterseiten: []
      },
    ]
  },
  {
    block: "Admin-Support",
    farbe: "#c02ba5",
    bereiche: [
      {
        label: "Admin-Support",
        path: "/profil/admin-support",
        unterseiten: []
      },
    ]
  }
];

/**
 * Prüft, ob der Pfad exakt übereinstimmt.
 */
export function istExakterPfadAktiv(aktuellerPfad, zielPfad) {
  return aktuellerPfad === zielPfad;
}

/**
 * Prüft, ob der Pfad mit dem Zielbereich beginnt.
 */
export function istBereichAktiv(aktuellerPfad, zielPfad) {
  return aktuellerPfad.startsWith(zielPfad);
}