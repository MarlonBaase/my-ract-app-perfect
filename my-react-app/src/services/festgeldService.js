import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";

// ---------------------------------------------------------------------------
// READ / LOAD OPERATIONS
// ---------------------------------------------------------------------------

export async function ladeFestgeld() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("festgeld")
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

    if (handleApiError(error, "Festgeld laden")) return [];
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

export async function ladeReferenzkonto() {
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

    if (data) {
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

    return [];
}

export const ladeKategorien = async () => {
    const { data, error } = await supabase
        .from("transaktionskategorie")
        .select("*")
        .eq("sichtbar", true)
        .order("name", { ascending: true });

    if (handleApiError(error, "Kategorie laden")) return [];
    return data || [];
};

export const ladeTransaktionenFuerAsset = async (assetId) => {
    if (!assetId) {
        console.warn("Keine Asset-ID vorhanden!");
        return [];
    }

    const { data, error } = await supabase
        .from("transaktionsprotokoll")
        .select("*")
        .eq("asset_id", assetId)
        .order('datum', { ascending: false });

    if (handleApiError(error, "Transaktionen laden")) return [];
    return data || [];
};

// ---------------------------------------------------------------------------
// WRITE / UPDATE / DELETE OPERATIONS
// ---------------------------------------------------------------------------

export async function festgeldHinzufuegen(formData) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Kein Benutzer angemeldet");

        // 1. Haupteintrag in 'asset'
        const { data: assetData, error: assetError } = await supabase
            .from("asset")
            .insert({
                benutzer_id: user.id,
                asset_name: formData.name,
                asset_typ: "festgeld",
            })
            .select();

        if (assetError || !assetData || assetData.length === 0) {
            handleApiError(assetError, "Erstellen des Assets");
            return false;
        }

        const asset_id = assetData[0].asset_id;

        // 2. Eintrag in 'festgeld'
        const { error: festgeldError } = await supabase
            .from("festgeld")
            .insert({
                benutzer_id: user.id,
                asset_id: asset_id,
                name_der_bank: formData.bank,
                einzahlung_bei_eroeffnung: parseFloat(formData.einzahlung_bei_eroeffnung) || 0,
                zinssatz: parseFloat(formData.zinssatz) || 0,
                laufzeit_monate: parseFloat(formData.laufzeitMonate) || 0,
                eroeffnungsdatum: formData.eroeffnungsdatum,
                faelligkeitsdatum: formData.faelligkeitsdatum,
                gekuendigt_am: formData.gekuendigtAm || null,
                zinsgutschrift: formData.zinsgutschrift || "",
                zinseszins: formData.zinseszins ?? true,
                freistellungsauftrag: parseFloat(formData.freistellungsauftrag) || 0,
                referenzkonto: formData.ausgewaehltesReferenzkonto,
                automatische_verlaengerung: formData.automatischVerlaengern ?? false,
                ist_aktiv: formData.ist_aktiv ?? true,
                notizen: formData.notizen || "",
                iban: formData.iban,
                bic: formData.bic || "",
                kontoinhaber: formData.kontoinhaber || ""
            });

        if (handleApiError(festgeldError, "Festgeld anlegen")) return false;

        // 3. Eröffnungstransaktion protokollieren
        const { error: transError } = await supabase
            .from("transaktionsprotokoll")
            .insert({
                benutzer_id: user.id,
                notizen: "Einzahlung bei Eröffnung",
                betrag: parseFloat(formData.einzahlung_bei_eroeffnung) || 0,
                kategorie_id: 'd5473c35-2e52-41ef-82a2-3eef5aff038f',
                asset_id: asset_id,
                assetklasse: "festgeld",
                typ: "einnahme"
            });

        if (handleApiError(transError, "Eröffnungstransaktion anlegen")) return false;

        return true;
    } catch (err) {
        console.error("Unerwarteter Fehler beim Hinzufügen:", err);
        return false;
    }
}

export async function festgeldSpeichern(assetId, formData) {
    if (!assetId) return false;

    // 1. Asset-Name aktualisieren
    const { error: assetError } = await supabase
        .from("asset")
        .update({ asset_name: formData.name })
        .eq("asset_id", assetId);

    if (handleApiError(assetError, "Asset Name updaten")) return false;

    // 2. Festgeld-Details aktualisieren
    const { error: festgeldError } = await supabase
        .from("festgeld")
        .update({
            name_der_bank: formData.bank,
            einzahlung_bei_eroeffnung: parseFloat(formData.einzahlung_bei_eroeffnung) || 0,
            zinssatz: parseFloat(formData.zinssatz) || 0,
            laufzeit_monate: parseFloat(formData.laufzeitMonate) || 0,
            eroeffnungsdatum: formData.eroeffnungsdatum,
            faelligkeitsdatum: formData.faelligkeitsdatum,
            gekuendigt_am: formData.gekuendigtAm || null,
            zinsgutschrift: formData.zinsgutschrift || "",
            zinseszins: formData.zinseszins ?? true,
            freistellungsauftrag: parseFloat(formData.freistellungsauftrag) || 0,
            referenzkonto: formData.ausgewaehltesReferenzkonto,
            automatische_verlaengerung: formData.automatischVerlaengern ?? false,
            ist_aktiv: formData.ist_aktiv ?? true,
            notizen: formData.notizen || "",
            iban: formData.iban,
            bic: formData.bic || "",
            kontoinhaber: formData.kontoinhaber || ""
        })
        .eq("asset_id", assetId);

    if (handleApiError(festgeldError, "Festgeld updaten")) return false;

    return true;
}

export async function transaktionHinzufuegen(transaktionsDaten) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("transaktionsprotokoll").insert({
        benutzer_id: user.id,
        notizen: transaktionsDaten.notizen,
        betrag: parseFloat(transaktionsDaten.betrag),
        kategorie_id: transaktionsDaten.kategorieId,
        asset_id: transaktionsDaten.assetId,
        assetklasse: "festgeld",
        typ: transaktionsDaten.typ
    });

    if (handleApiError(error, "Transaktion hinzufügen")) return false;
    return true;
}

export async function assetLoeschenMitLog(assetId, assetTyp, tabelleName) {
    if (!assetId) return false;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // 1. Transaktionen sichern und löschen
        const { data: werte, error: tlogError } = await supabase
            .from("transaktionsprotokoll")
            .select("*")
            .eq("asset_id", assetId);

        if (handleApiError(tlogError, "Transaktionen vor dem Löschen abrufen")) return false;

        const { error: ttlogError } = await supabase
            .from("geloeschte_transaktionen_log")
            .insert({
                benutzer_id: user.id,
                asset_id: assetId,
                asset_typ: assetTyp,
                daten: werte,
            });

        if (handleApiError(ttlogError, "Transaktions-Log befüllen")) return false;

        const { error: tDeleteError } = await supabase
            .from("transaktionsprotokoll")
            .delete()
            .eq("asset_id", assetId);

        if (handleApiError(tDeleteError, `${assetTyp} Transaktionen löschen`)) return false;

        // 2. Asset-Spezifische Daten sichern & löschen
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

        if (handleApiError(logError, "Asset Log-Tabelle befüllen")) return false;

        const { error: subDeleteError } = await supabase
            .from(tabelleName)
            .delete()
            .eq("asset_id", assetId);

        if (handleApiError(subDeleteError, `${assetTyp} löschen`)) return false;

        // 3. Aus Haupteintrag löschen
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

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------

export function formatEuro(betrag) {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
        Number(betrag || 0)
    );
}