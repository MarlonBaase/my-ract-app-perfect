import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";

// ---------------------------------------------------------------------------
// READ / LOAD OPERATIONS
// ---------------------------------------------------------------------------

export async function ladeFremdwaehrungskonto() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("fremdwaehrungskonto")
        .select(`*, 
            asset(
                benutzer_id,
                asset_name,
                asset_id,
                transaktionsprotokoll(betrag, typ)
            )
        `)
        .eq("benutzer_id", user.id);

    if (handleApiError(error, "Fremdwaehrungskonto laden")) return [];
    return data || [];
}

export async function ladeWaehrungen() {
    const { data, error } = await supabase
        .from("waehrungsstammdaten")
        .select(`waehrungs_code, name, symbol`)
        .order("name", { ascending: true });

    if (handleApiError(error, "Waehrung laden")) return [];
    return data || [];
}

export async function ladeAssets() {
    const { data, error } = await supabase
        .from("asset")
        .select("*")
        .order("asset_name", { ascending: true });

    if (handleApiError(error, "Assets laden")) return [];
    return data || [];
}

export async function ladeElternkontoListe() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("fremdwaehrungskonto")
        .select("*")
        .eq("benutzer_id", user.id)
        .eq("hauptkonto", true);

    if (handleApiError(error, "Elternkonten laden")) return [];
    return data || [];
}

export async function ladeKategorien() {
    const { data, error } = await supabase
        .from("transaktionskategorie")
        .select("*")
        .eq("sichtbar", true)
        .order("name", { ascending: true });

    if (handleApiError(error, "Kategorie laden")) return [];
    return data || [];
}

export async function ladeTransaktionenFuerAsset(assetId) {
    if (!assetId) return [];

    const { data, error } = await supabase
        .from("transaktionsprotokoll")
        .select("*")
        .eq("asset_id", assetId)
        .order('datum', { ascending: false });

    if (handleApiError(error, "Transaktionen laden")) return [];
    return data || [];
}

// ---------------------------------------------------------------------------
// WRITE / UPDATE / DELETE OPERATIONS
// ---------------------------------------------------------------------------

export async function fremdwaehrungskontoHinzufuegen(formData) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // 1. Asset anlegen
        const { data: assetData, error: assetError } = await supabase
            .from("asset")
            .insert({
                benutzer_id: user.id,
                asset_name: formData.name,
                asset_typ: "fremdwaehrungskonto",
            })
            .select();

        if (assetError || !assetData || assetData.length === 0) {
            handleApiError(assetError, "Erstellen des Assets");
            return false;
        }

        const asset_id = assetData[0].asset_id;

        // 2. Fremdwährungskonto anlegen
        const { error: giroError } = await supabase
            .from("fremdwaehrungskonto")
            .insert({
                asset_id: asset_id,
                benutzer_id: user.id,
                name_der_bank: formData.bank,
                iban: formData.iban,
                einzahlung_bei_eroeffnung: parseFloat(formData.einzahlung_bei_eroeffnung) || 0,
                waehrung: formData.waehrung,
                waehrungs_code: formData.waehrungs_code,
                eroeffnungsdatum: formData.eroeffnungsdatum,
                notizen: formData.transaktionsNotizen,
                kontoinhaber: formData.kontoinhaber,
                ist_aktiv: formData.ist_aktiv ?? true,
                hauptkonto: formData.hauptkonto ?? false,
                elternkonto: formData.ausgewaehltesElternkonto || null,
                dispo_limit: parseFloat(formData.dispo_limit) || 0,
                bic: formData.bic || "",
                zinssatz: parseFloat(formData.zinssatz) || 0,
                ist_referenzkonto: formData.ist_referenzkonto || false
            });

        if (handleApiError(giroError, "Fremdwaehrungskonto anlegen")) return false;

        // 3. Eröffnungstransaktion protokollieren
        const { error: transError } = await supabase
            .from("transaktionsprotokoll")
            .insert({
                benutzer_id: user.id,
                notizen: "Einzahlung bei Eröffnung",
                betrag: parseFloat(formData.einzahlung_bei_eroeffnung) || 0,
                kategorie_id: 'd5473c35-2e52-41ef-82a2-3eef5aff038f',
                asset_id: asset_id,
                assetklasse: "fremdwaehrungskonto",
                typ: "einnahme"
            });

        if (handleApiError(transError, "Eröffnungstransaktion anlegen")) return false;

        return true;
    } catch (err) {
        console.error("Unerwarteter Fehler beim Hinzufügen:", err);
        return false;
    }
}

export async function fremdwaehrungskontoSpeichern(assetId, formData) {
    if (!assetId) return false;

    const { error: assetError } = await supabase
        .from("asset")
        .update({ asset_name: formData.name })
        .eq("asset_id", assetId);

    if (handleApiError(assetError, "Asset Name updaten")) return false;

    const { error: giroError } = await supabase
        .from("fremdwaehrungskonto")
        .update({
            name_der_bank: formData.bank,
            iban: formData.iban,
            einzahlung_bei_eroeffnung: parseFloat(formData.einzahlung_bei_eroeffnung) || 0,
            waehrung: formData.waehrung,
            eroeffnungsdatum: formData.eroeffnungsdatum,
            notizen: formData.transaktionsNotizen,
            kontoinhaber: formData.kontoinhaber,
            ist_aktiv: formData.ist_aktiv,
            hauptkonto: formData.hauptkonto,
            elternkonto: formData.ausgewaehltesElternkonto || null,
            dispo_limit: parseFloat(formData.dispo_limit) || 0,
            bic: formData.bic,
            zinssatz: parseFloat(formData.zinssatz) || 0,
            ist_referenzkonto: formData.ist_referenzkonto || false,
            waehrungs_code: formData.waehrungs_code
        })
        .eq("asset_id", assetId);

    if (handleApiError(giroError, "Fremdwaehrungskontodaten updaten")) return false;

    return true;
}

export async function transaktionHinzufuegen(transData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    let berechneteFaelligkeit = null;

    if (transData.wiederkehrendaktiv) {
        const heute = new Date();
        switch (transData.intervall) {
            case "täglich":
                heute.setDate(heute.getDate() + 1);
                break;
            case "wöchentlich":
                heute.setDate(heute.getDate() + 7);
                break;
            case "monatlich":
                heute.setMonth(heute.getMonth() + 1);
                break;
            case "jährlich":
                heute.setFullYear(heute.getFullYear() + 1);
                break;
            default:
                break;
        }
        berechneteFaelligkeit = heute.toISOString();
    }

    const { error } = await supabase.from("transaktionsprotokoll").insert({
        benutzer_id: user.id,
        notizen: transData.transaktionsNotizen,
        betrag: parseFloat(transData.transaktionsBetrag),
        kategorie_id: transData.transaktionsKategorie,
        asset_id: transData.assetId,
        assetklasse: "fremdwaehrungskonto",
        typ: transData.transaktionsTyp,
        wiederkehrend: transData.wiederkehrendaktiv,
        naechste_faelligkeit: berechneteFaelligkeit,
        intervall: transData.wiederkehrendaktiv ? transData.intervall : null
    });

    if (handleApiError(error, "Transaktion hinzufügen")) return false;
    return true;
}

export async function pruefeWiederkehren() {
    const heute = new Date().toISOString();

    const { data: faellige, error } = await supabase
        .from("transaktionsprotokoll")
        .select("*")
        .eq("wiederkehrend", true)
        .lte("naechste_faelligkeit", heute);

    if (error || !faellige || faellige.length === 0) return;

    for (const t of faellige) {
        await supabase.from("transaktionsprotokoll").insert({
            benutzer_id: t.benutzer_id,
            notizen: `${t.notizen} (Automatisch)`,
            betrag: t.betrag,
            kategorie_id: t.kategorie_id,
            asset_id: t.asset_id,
            assetklasse: t.assetklasse,
            typ: t.typ,
            datum: heute,
            wiederkehrend: false
        });

        const naechstesDatum = new Date(t.naechste_faelligkeit);
        if (t.intervall === "täglich") naechstesDatum.setDate(naechstesDatum.getDate() + 1);
        if (t.intervall === "wöchentlich") naechstesDatum.setDate(naechstesDatum.getDate() + 7);
        if (t.intervall === "monatlich") naechstesDatum.setMonth(naechstesDatum.getMonth() + 1);
        if (t.intervall === "jährlich") naechstesDatum.setFullYear(naechstesDatum.getFullYear() + 1);

        await supabase
            .from("transaktionsprotokoll")
            .update({ naechste_faelligkeit: naechstesDatum.toISOString().split('T')[0] })
            .eq("id", t.id);
    }
}

export async function assetLoeschenMitLog(assetId, assetTyp, tabelleName) {
    if (!assetId) return false;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: werte, error: tlogError } = await supabase
            .from("transaktionsprotokoll")
            .select("*")
            .eq("asset_id", assetId);

        if (handleApiError(tlogError, "Asset vor dem Löschen abrufen")) return false;

        const { error: ttlogError } = await supabase
            .from("geloeschte_transaktionen_log")
            .insert({
                benutzer_id: user.id,
                asset_id: assetId,
                asset_typ: assetTyp,
                daten: werte,
            });

        if (handleApiError(ttlogError, "Globale Log-Tabelle befüllen")) return false;

        const { error: tDeleteError } = await supabase
            .from("transaktionsprotokoll")
            .delete()
            .eq("asset_id", assetId);

        if (handleApiError(tDeleteError, `${assetTyp} löschen`)) return false;

        const { data: eintrag, error: fetchError } = await supabase
            .from(tabelleName)
            .select("*")
            .eq("asset_id", assetId)
            .single();

        if (handleApiError(fetchError, "Asset vor dem Löschen abrufen")) return false;

        const { error: logError } = await supabase
            .from("geloeschte_assets_log")
            .insert({
                benutzer_id: user.id,
                asset_id: assetId,
                asset_typ: assetTyp,
                asset_name: eintrag?.name || eintrag?.name_der_bank || "Unbenannt",
                daten: eintrag,
            });

        if (handleApiError(logError, "Globale Log-Tabelle befüllen")) return false;

        const { error: subDeleteError } = await supabase
            .from(tabelleName)
            .delete()
            .eq("asset_id", assetId);

        if (handleApiError(subDeleteError, `${assetTyp} löschen`)) return false;

        const { error: mainDeleteError } = await supabase
            .from("asset")
            .delete()
            .eq("asset_id", assetId);

        if (handleApiError(mainDeleteError, "Asset Haupteintrag löschen")) return false;

        return true;
    } catch (err) {
        console.error("Unerwarteter Fehler beim Löschen:", err);
        return false;
    }
}