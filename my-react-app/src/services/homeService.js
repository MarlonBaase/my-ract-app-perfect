import { supabase } from "../supabase";

/**
 * Führt den Login mit E-Mail und Passwort durch und prüft, 
 * ob eine MFA (2FA) erforderlich ist (Level AAL2).
 * 
 * @returns {Promise<{ success: boolean, requiresMfa?: boolean, factorId?: string, error?: string }>}
 */
export async function anmeldenMitPasswort(email, password) {
  // 1. Primärer Login
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { success: false, error: signInError.message };
  }

  // 2. Prüfen, ob 2FA (AAL2) erforderlich ist
  const { data: mfaData, error: mfaError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (mfaError) {
    return { success: false, error: mfaError.message };
  }

  if (mfaData.nextLevel === "aal2" && mfaData.nextLevel !== mfaData.currentLevel) {
    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();

    if (factorsError) {
      return { success: false, error: factorsError.message };
    }

    const totpFactor = factors?.totp?.find((f) => f.status === "verified");

    if (totpFactor) {
      return {
        success: true,
        requiresMfa: true,
        factorId: totpFactor.id,
      };
    }
  }

  return { success: true, requiresMfa: false };
}

/**
 * Verifiziert den 6-stelligen 2FA-Code gegen Supabase.
 * 
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function verifiziere2FACode(factorId, otpCode) {
  const cleanCode = String(otpCode).replace(/\s+/g, "").trim();

  if (!cleanCode || cleanCode.length !== 6) {
    return { success: false, error: "Bitte gib einen 6-stelligen Code ein." };
  }

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: cleanCode,
  });

  if (error) {
    return { success: false, error: "2FA-Fehler: " + error.message };
  }

  return { success: true };
}