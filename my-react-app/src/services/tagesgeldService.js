import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";

export async function ladeTagesgeldKontoListe() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("tagesgeldkonto")
        .select(`*, 
            asset!inner(
                benutzer_id,
                asset_name,
                asset_id,
                transaktionsprotokoll(betrag, typ)
            )
        `)
        .eq("asset.benutzer_id", user.id)
        .order('asset_name', { referencedTable: 'asset', ascending: true });

    if (handleApiError(error, "Tagesgeld laden")) return [];
    return data || [];
}

export async function ladeTransaktionenFuerTagesgeldAsset(assetId) {
    if (!assetId) return [];

    const { data, error } = await supabase
        .from("transaktionsprotokoll")
        .select("*")
        .eq("asset_id", assetId)
        .order('datum', { ascending: false });

    if (handleApiError(error, "Transaktionen öffnen")) return [];
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

export async function ladeAssets() {
    const { data } = await supabase
        .from("asset")
        .select("*")
        .order("asset_name", { ascending: true });

    return data || [];
}

export async function ladeReferenzkontenListe() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("asset")
        .select(`*,
            tagesgeldkonto!left(*),
            girokonto!left(*)`)
        .eq("benutzer_id", user.id)
        .eq("tagesgeldkonto.ist_referenzkonto", true)
        .eq("girokonto.ist_referenzkonto", true)
        .order('asset_name', { ascending: true });

    if (handleApiError(error, "Referenzkonto laden")) return [];

    if (!data) return [];

    return data
        .map(asset => {
            const tagesgeld = Array.isArray(asset.tagesgeldkonto)
                ? asset.tagesgeldkonto[0]
                : asset.tagesgeldkonto;

            const girokonto = Array.isArray(asset.girokonto)
                ? asset.girokonto[0]
                : asset.girokonto;

            return {
                ...asset,
                tagesgeldkonto: tagesgeld || null,
                girokonto: girokonto || null
            };
        })
        .filter(asset => {
            const istTagesgeldAktiv = asset.tagesgeldkonto?.ist_aktiv === true;
            const istGiroAktiv = asset.girokonto?.ist_aktiv === true;
            return istTagesgeldAktiv || istGiroAktiv;
        });
}

export async function tagesgeldkontoHinzufuegen(formData) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: assetData, error: assetError } = await supabase
            .from("asset")
            .insert({
                benutzer_id: user.id,
                asset_name: formData.name,
                asset_typ: "tagesgeldkonto",
            })
            .select();

        if (assetError || !assetData || assetData.length === 0) {
            console.error("Fehler beim Erstellen des Assets:", assetError?.message);
            return false;
        }

        const asset_id = assetData[0].asset_id;

        const { error: tagesgeldkontoError } = await supabase
            .from("tagesgeldkonto")
            .insert({
                benutzer_id: user.id,
                asset_id: asset_id,
                name_der_bank: formData.bank,
                iban: formData.iban,
                waehrung: formData.waehrung || "EUR",
                zinssatz: parseFloat(formData.zinssatz) || 0,
                zinsintervall: formData.zinssintervall || "monatlich",
                referenzkonto: formData.ausgewaehltesReferenzkonto,
                freistellungsauftrag: formData.freistellungsauftrag || 0,
                aktionszins: parseFloat(formData.aktionszins) || 0,
                ablaufdatum_aktionszins: formData.ablaufdatum_aktionszins || null,
                notgroschen: formData.notgroschen || false,
                einlagensicherung: parseFloat(formData.einlagensicherung) || 100000,
                sparrate: parseFloat(formData.sparrate),
                sparziel: parseFloat(formData.sparziel),
                mindestbetrag: parseFloat(formData.mindestbetrag) || 0,
                ist_aktiv: true,
                notizen: formData.notizen || "",
                eroeffnungsdatum: formData.eroeffnungsdatum,
                kontoinhaber: formData.kontoinhaber || "",
                bic: formData.bic || "",
                einzahlung_bei_eroeffnung: parseFloat(formData.einzahlung_bei_eroeffnung) || 0,
                ist_referenzkonto: formData.ist_referenzkonto || false
            });

        if (handleApiError(tagesgeldkontoError, "Tagesgeldkonto-Insert")) return false;

        const { error: transError } = await supabase
            .from("transaktionsprotokoll")
            .insert({
                benutzer_id: user.id,
                notizen: "Einzahlung bei Eröffnung",
                betrag: parseFloat(formData.einzahlung_bei_eroeffnung) || 0,
                kategorie_id: 'd5473c35-2e52-41ef-82a2-3eef5aff038f',
                asset_id: asset_id,
                assetklasse: "tagesgeldkonto",
                typ: "einnahme"
            });

        if (handleApiError(transError, "Eröffnungstransaktion anlegen")) return false;

        return true;
    } catch (err) {
        console.error("Unerwarteter Fehler:", err);
        return false;
    }
}

export async function tagesgeldkontoSpeichern(assetId, formData) {
    if (!assetId) return false;

    const { error: assetError } = await supabase
        .from("asset")
        .update({ asset_name: formData.name })
        .eq("asset_id", assetId);

    if (handleApiError(assetError, "Asset Name updaten")) return false;

    const { error: tagesgeldkontoError } = await supabase
        .from("tagesgeldkonto")
        .update({
            name_der_bank: formData.bank,
            iban: formData.iban,
            waehrung: formData.waehrung,
            zinssatz: parseFloat(formData.zinssatz) || 0,
            zinsintervall: formData.zinssintervall || "monatlich",
            referenzkonto: formData.referenzkonto,
            freistellungsauftrag: formData.freistellungsauftrag || "1000",
            aktionszins: parseFloat(formData.aktionszins) || 0,
            ablaufdatum_aktionszins: formData.ablaufdatum_aktionszins || null,
            notgroschen: formData.notgroschen || false,
            einlagensicherung: parseFloat(formData.einlagensicherung) || 100000,
            sparrate: parseFloat(formData.sparrate),
            sparziel: parseFloat(formData.sparziel),
            mindestbetrag: parseFloat(formData.mindestbetrag) || 0,
            ist_aktiv: formData.ist_aktiv,
            notizen: formData.notizen || "",
            eroeffnungsdatum: formData.eroeffnungsdatum,
            kontoinhaber: formData.kontoinhaber || "",
            bic: formData.bic || "",
            einzahlung_bei_eroeffnung: parseFloat(formData.einzahlung_bei_eroeffnung) || 0,
            ist_referenzkonto: formData.ist_referenzkonto || false
        })
        .eq("asset_id", assetId);

    if (handleApiError(tagesgeldkontoError, "Tagesgeldkontodaten updaten")) return false;

    return true;
}

export async function transaktionHinzufuegen(transData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("transaktionsprotokoll").insert({
        benutzer_id: user.id,
        notizen: transData.transaktionsNotizen,
        betrag: parseFloat(transData.transaktionsBetrag),
        kategorie_id: transData.transaktionsKategorie,
        asset_id: transData.ausgewaehltesAsset,
        assetklasse: "tagesgeldkonto",
        typ: transData.transaktionsTyp
    });

    if (handleApiError(error, "Transaktion hinzufügen")) return false;
    return true;
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