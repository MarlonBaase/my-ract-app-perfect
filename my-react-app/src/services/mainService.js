import { supabase } from "../supabase";

/**
 * Überprüft, ob die aktuelle Session das erforderliche MFA-Level (AAL) erfüllt.
 * Gibt die Session zurück, wenn MFA gültig ist, andernfalls null.
 */
export async function pruefeMfaUndSession(currentSession) {
  if (!currentSession) return null;

  try {
    const { data: mfaData, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      console.error("Fehler beim Abrufen des MFA-Levels:", error.message);
      return null;
    }

    if (mfaData && mfaData.currentLevel === mfaData.nextLevel) {
      return currentSession;
    }
    return null;
  } catch (err) {
    console.error("Unerwarteter Fehler bei MFA-Prüfung:", err);
    return null;
  }
}

/**
 * Richtet Listener und initiale Session-Abfrage für Supabase Auth ein.
 */
export function initialisiereAuthObserver(onSessionChange) {
  // 1. Initalen Zustand laden
  supabase.auth.getSession().then(({ data }) => {
    pruefeMfaUndSession(data.session).then(onSessionChange);
  });

  // 2. Auf Auth-Änderungen lauschen
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    pruefeMfaUndSession(session).then(onSessionChange);
  });

  return () => subscription.unsubscribe();
}