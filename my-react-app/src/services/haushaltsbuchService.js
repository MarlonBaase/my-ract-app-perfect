import { supabase } from "../supabase";

// ---------------------------------------------------------------------------
// DATENBANK-ABFRAGEN (READ / WRITE / DELETE)
// ---------------------------------------------------------------------------

export async function ladeTransaktionsProtokoll() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { kapital: 0, alle: [] };

  const { data: ausgaben, error: ausgabenError } = await supabase
    .from("transaktionsprotokoll")
    .select(`
      *,
      asset!asset_id (asset_name, asset_typ),
      transaktionskategorie!kategorie_id (name)
    `)
    .eq("benutzer_id", user.id)
    .eq("typ", "ausgabe")
    .order("erstellt_am", { ascending: false });

  if (ausgabenError) {
    console.error("Supabase-Fehler Details:", ausgabenError.message, ausgabenError.details);
  }

  const { data: einnahmen } = await supabase
    .from("transaktionsprotokoll")
    .select(`
      *,
      asset!asset_id (asset_name, asset_typ),
      transaktionskategorie!kategorie_id (name)
    `)
    .eq("benutzer_id", user.id)
    .eq("typ", "einnahme")
    .order("erstellt_am", { ascending: false });

  const gesamtAusgaben = ausgaben?.reduce((sum, e) => sum + e.betrag, 0) ?? 0;
  const gesamtEinnahmen = einnahmen?.reduce((sum, e) => sum + e.betrag, 0) ?? 0;
  const kapital = gesamtEinnahmen - gesamtAusgaben;

  const alle = [
    ...(ausgaben ?? []).map((e) => ({ ...e, typ: "ausgabe" })),
    ...(einnahmen ?? []).map((e) => ({ ...e, typ: "einnahme" })),
  ].sort((a, b) => new Date(b.erstellt_am) - new Date(a.erstellt_am));

  return { kapital, alle };
}

export async function ladeKategorien() {
  const { data } = await supabase
    .from("transaktionskategorie")
    .select("*")
    .eq("sichtbar", true)
    .order("name", { ascending: true });

  return data || [];
}

export async function ladeAssets() {
  const { data } = await supabase
    .from("asset")
    .select("*")
    .order("asset_name", { ascending: true });

  return data || [];
}

export async function transaktionHinzufuegen(formData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("transaktionsprotokoll").insert({
    benutzer_id: user.id,
    notizen: formData.beschreibung,
    betrag: parseFloat(formData.betrag),
    kategorie_id: formData.kategorie,
    asset_id: formData.assetId || null,
    typ: formData.typ
  });

  return !error;
}

export async function eintragLoeschen(id) {
  const { error } = await supabase.from("transaktionsprotokoll").delete().eq("id", id);
  return !error;
}

export async function eintragSpeichern(id, editData) {
  const { error } = await supabase.from("transaktionsprotokoll").update({
    notizen: editData.beschreibung,
    betrag: parseFloat(editData.betrag),
    kategorie_id: editData.kategorie,
  }).eq("id", id);

  return !error;
}

export async function ladeWiederkehrende() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("transaktionsprotokoll")
    .select("*")
    .eq("benutzer_id", user.id)
    .eq("wiederkehrend", true)
    .order("erstellt_am", { ascending: false });

  return data ?? [];
}

export async function pruefeWiederkehrende(liste) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const now = new Date();
  const heute = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const eintrag of liste) {
    if (eintrag.naechste_faelligkeit <= heute) {
      await supabase.from("transaktionsprotokoll").insert({
        benutzer_id: user.id,
        notizen: eintrag.notizen,
        betrag: parseFloat(eintrag.betrag),
        kategorie_id: eintrag.kategorie_id,
        asset_id: eintrag.asset_id,
        typ: eintrag.typ
      });

      const parts = eintrag.naechste_faelligkeit.split("-");
      const naechsteDatum = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

      if (eintrag.intervall === "täglich") naechsteDatum.setDate(naechsteDatum.getDate() + 1);
      if (eintrag.intervall === "wöchentlich") naechsteDatum.setDate(naechsteDatum.getDate() + 7);
      if (eintrag.intervall === "monatlich") naechsteDatum.setMonth(naechsteDatum.getMonth() + 1);
      if (eintrag.intervall === "jährlich") naechsteDatum.setFullYear(naechsteDatum.getFullYear() + 1);

      const neuesFaelligkeitsDatum = `${naechsteDatum.getFullYear()}-${String(naechsteDatum.getMonth() + 1).padStart(2, '0')}-${String(naechsteDatum.getDate()).padStart(2, '0')}`;

      await supabase.from("transaktionsprotokoll")
        .update({ naechste_faelligkeit: neuesFaelligkeitsDatum })
        .eq("id", eintrag.id)
        .eq("wiederkehrend", true);
    }
  }
}

// ---------------------------------------------------------------------------
// DATENBERECHNUNG UND DIAGRAMM-AUFBEREITUNG
// ---------------------------------------------------------------------------

export function berechneZeitraumSummen(eintraege, zeitraum) {
  const jetzt = new Date();

  const meisteFilter = (e, typ) => {
    if (e.typ !== typ) return false;
    const datum = new Date(e.erstellt_am);

    if (zeitraum === "heute") {
      return datum.getFullYear() === jetzt.getFullYear() &&
        datum.getMonth() === jetzt.getMonth() &&
        datum.getDate() === jetzt.getDate();
    }
    if (zeitraum === "woche") {
      const diffInTagen = (jetzt - datum) / (1000 * 60 * 60 * 24);
      return diffInTagen <= 7;
    }
    if (zeitraum === "monat") {
      return datum.getMonth() === jetzt.getMonth() &&
        datum.getFullYear() === jetzt.getFullYear();
    }
    if (zeitraum === "jahr") {
      return datum.getFullYear() === jetzt.getFullYear();
    }
    return false;
  };

  const gefilterteAusgaben = eintraege.filter(e => meisteFilter(e, "ausgabe"));
  const gefilterteEinnahmen = eintraege.filter(e => meisteFilter(e, "einnahme"));

  return {
    summeAusgaben: gefilterteAusgaben.reduce((sum, e) => sum + e.betrag, 0),
    summeEinnahmen: gefilterteEinnahmen.reduce((sum, e) => sum + e.betrag, 0)
  };
}

export function erstelleLiniendiagrammData(eintraege, zeitraum) {
  const jetzt = new Date();
  let punkte = [];

  if (zeitraum === "heute") {
    for (let i = 0; i < 24; i++) {
      const einnahmen = eintraege
        .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am.replace(" ", "T")).getHours() === i &&
          new Date(e.erstellt_am.replace(" ", "T")).getDate() === jetzt.getDate())
        .reduce((sum, e) => sum + e.betrag, 0);
      const ausgaben = eintraege
        .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am.replace(" ", "T")).getHours() === i &&
          new Date(e.erstellt_am.replace(" ", "T")).getDate() === jetzt.getDate())
        .reduce((sum, e) => sum + e.betrag, 0);
      punkte.push({ label: `${i}:00`, einnahmen, ausgaben });
    }
  }

  if (zeitraum === "woche") {
    for (let i = 6; i >= 0; i--) {
      const tag = new Date();
      tag.setDate(jetzt.getDate() - i);
      const einnahmen = eintraege
        .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getDate() === tag.getDate() &&
          new Date(e.erstellt_am).getMonth() === tag.getMonth())
        .reduce((sum, e) => sum + e.betrag, 0);
      const ausgaben = eintraege
        .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getDate() === tag.getDate() &&
          new Date(e.erstellt_am).getMonth() === tag.getMonth())
        .reduce((sum, e) => sum + e.betrag, 0);
      punkte.push({ label: `${tag.getDate()}.`, einnahmen, ausgaben });
    }
  }

  if (zeitraum === "monat") {
    const tageImMonat = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= tageImMonat; i++) {
      const einnahmen = eintraege
        .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getDate() === i &&
          new Date(e.erstellt_am).getMonth() === jetzt.getMonth())
        .reduce((sum, e) => sum + e.betrag, 0);
      const ausgaben = eintraege
        .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getDate() === i &&
          new Date(e.erstellt_am).getMonth() === jetzt.getMonth())
        .reduce((sum, e) => sum + e.betrag, 0);
      punkte.push({ label: `${i}.`, einnahmen, ausgaben });
    }
  }

  if (zeitraum === "jahr") {
    const monate = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    for (let i = 0; i < 12; i++) {
      const einnahmen = eintraege
        .filter(e => e.typ === "einnahme" && new Date(e.erstellt_am).getMonth() === i &&
          new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear())
        .reduce((sum, e) => sum + e.betrag, 0);
      const ausgaben = eintraege
        .filter(e => e.typ === "ausgabe" && new Date(e.erstellt_am).getMonth() === i &&
          new Date(e.erstellt_am).getFullYear() === jetzt.getFullYear())
        .reduce((sum, e) => sum + e.betrag, 0);
      punkte.push({ label: monate[i], einnahmen, ausgaben });
    }
  }

  return punkte;
}

export function erstelleKreisdiagrammData(eintraege, zeitraum) {
  const jetzt = new Date();

  const zeitraumFilter = (e) => {
    const datum = new Date(e.erstellt_am);
    if (zeitraum === "heute") {
      return datum.getFullYear() === jetzt.getFullYear() &&
        datum.getMonth() === jetzt.getMonth() &&
        datum.getDate() === jetzt.getDate();
    }
    if (zeitraum === "woche") {
      const diffInTagen = (jetzt - datum) / (1000 * 60 * 60 * 24);
      return diffInTagen <= 7;
    }
    if (zeitraum === "monat") {
      return datum.getMonth() === jetzt.getMonth() &&
        datum.getFullYear() === jetzt.getFullYear();
    }
    if (zeitraum === "jahr") {
      return datum.getFullYear() === jetzt.getFullYear();
    }
    return false;
  };

  const gefilterteAusgaben = eintraege.filter(e => e.typ === "ausgabe" && zeitraumFilter(e));
  const ausgabenProAsset = gefilterteAusgaben.reduce((acc, e) => {
    const assetKlasse = e.asset?.asset_typ || "Keine Assetklasse";
    acc[assetKlasse] = (acc[assetKlasse] ?? 0) + e.betrag;
    return acc;
  }, {});

  const gefilterteEinnahmen = eintraege.filter(e => e.typ === "einnahme" && zeitraumFilter(e));
  const einnahmenProAsset = gefilterteEinnahmen.reduce((acc, e) => {
    const assetKlasse = e.asset?.asset_typ || "Keine Assetklasse";
    acc[assetKlasse] = (acc[assetKlasse] ?? 0) + e.betrag;
    return acc;
  }, {});

  return {
    ausgaben: Object.entries(ausgabenProAsset).map(([name, value]) => ({ name, value })),
    einnahmen: Object.entries(einnahmenProAsset).map(([name, value]) => ({ name, value }))
  };
}