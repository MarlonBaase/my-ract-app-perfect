import { supabase } from "../supabase";

// --- KATEGORIEN ---

export async function ladeKategorien() {
  const { data, error } = await supabase
    .from("transaktionskategorie")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function kategorieHinzufuegen(neueKategorie) {
  if (!neueKategorie) return;

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Nicht eingeloggt");

  const { data, error } = await supabase
    .from("transaktionskategorie")
    .insert({
      benutzer_id: user.id,
      name: neueKategorie,
      ist_vordefiniert: false,
      erstellt_am: new Date()
    })
    .select();

  if (error) throw error;
  return data;
}

export async function kategorieLoeschen(id, ist_vordefiniert) {
  if (ist_vordefiniert === false) {
    const { error } = await supabase
      .from("transaktionskategorie")
      .delete()
      .eq("id", id);
      
    if (error) throw error;
  }
}

// --- AUTH / LOGOUT ---

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = "https://my-ract-app-perfect.vercel.app/";
}

// --- 2FA / MFA LOGIK ---

export async function startSetup2FA() {
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();

  if (listError) throw listError;

  if (factors && factors.totp) {
    const verifiedFactor = factors.totp.find(f => f.status === 'verified');
    if (verifiedFactor) {
      throw new Error("2FA ist bereits aktiv! Deaktiviere es zuerst, um es neu einzurichten.");
    }

    const unverifiedFactors = factors.totp.filter(f => f.status === 'unverified');
    for (const factor of unverifiedFactors) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `MeinAuthenticator_${Date.now()}`
  });

  if (error) throw error;

  // Gibt QR-Code-URL und factorID an die UI zurück
  return {
    qrCodeUrl: data.totp.qr_code,
    factorId: data.id
  };
}

export async function enableMfa({ factorId, confirmCode }) {
  if (!confirmCode || !factorId) {
    throw new Error("Code oder Faktor-ID fehlt.");
  }

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factorId,
    code: confirmCode
  });

  if (error) throw error;
  return data;
}

export async function disableMfa() {
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) throw listError;

  const verifiedFactor = factors?.totp?.find(f => f.status === 'verified');

  if (!verifiedFactor) {
    throw new Error("Kein aktiver 2FA-Faktor vorhanden.");
  }

  const { error } = await supabase.auth.mfa.unenroll({
    factorId: verifiedFactor.id
  });

  if (error) throw error;
}