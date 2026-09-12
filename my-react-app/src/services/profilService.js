/**
 * Layout-Konfiguration für das Profil-Layout.
 */
export const PROFIL_LAYOUT_CONFIG = {
  sidebarOpenLeft: "248px",
  sidebarClosedLeft: "0px",
  toggleButtonBottom: "70px",
  toggleButtonColor: "#4F6EF7",
  contentPaddingLeft: "50px",
  contentPaddingTop: "50px",
};

/**
 * Errechnet die `left`-Position des Toggle-Buttons basierend auf dem Status.
 */
export function getSidebarToggleLeft(isOpen) {
  return isOpen
    ? PROFIL_LAYOUT_CONFIG.sidebarOpenLeft
    : PROFIL_LAYOUT_CONFIG.sidebarClosedLeft;
}