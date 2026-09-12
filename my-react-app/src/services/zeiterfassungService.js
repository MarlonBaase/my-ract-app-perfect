import { supabase } from "../supabase";

export async function ladeZeiterfassungen() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("zeiterfassung")
        .select("*")
        .eq("benutzer_id", user.id)
        .order("erstellt_am", { ascending: false });

    if (error) {
        console.error("Fehler beim Laden der Zeiterfassungen:", error.message);
        return [];
    }
    return data || [];
}

export async function ladeNaechsteTicketNummer() {
    const { data } = await supabase
        .from("zeiterfassung")
        .select("ticket_nummer")
        .order("ticket_nummer", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (data && data.ticket_nummer !== undefined && data.ticket_nummer !== null) {
        const nummer = Number(data.ticket_nummer);
        return isNaN(nummer) ? 1 : nummer + 1;
    }
    return 1;
}

export async function prozessErstellenApi(formData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Nicht eingeloggt" };

    const { error } = await supabase.from("zeiterfassung").insert({
        benutzer_id: user.id,
        ticket_nummer: Number(formData.ticketNummer),
        prozess_name: formData.prozessName,
        beschreibung: formData.beschreibung || "",
        prioritaet: formData.prioritaet || "mittel",
        deadline: formData.deadline || null,
        bereich: formData.bereich || "Hauptbereiche",
        fortlaufende_notizen: formData.notizen || "",
        status: "offen"
    });

    if (error) {
        console.error("Fehler beim Erstellen des Prozesses:", error.message);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function toggleTimerApi(eintrag) {
    const jetzt = new Date().toISOString();

    if (eintrag.is_running) {
        const zusaetzlicheSekunden = Math.floor((new Date() - new Date(eintrag.gestartet_am)) / 1000);
        const neueDauer = (eintrag.dauer_sekunden || 0) + zusaetzlicheSekunden;

        const { error } = await supabase
            .from("zeiterfassung")
            .update({
                is_running: false,
                dauer_sekunden: neueDauer,
                gestartet_am: null,
                end_zeit: jetzt,
                status: eintrag.status || "in_bearbeitung"
            })
            .eq("id", eintrag.id);

        return !error;
    } else {
        const { error } = await supabase
            .from("zeiterfassung")
            .update({
                is_running: true,
                gestartet_am: jetzt,
                start_zeit: eintrag.start_zeit || jetzt,
                status: eintrag.status || "in_bearbeitung"
            })
            .eq("id", eintrag.id);

        return !error;
    }
}

export async function zeitHinzufuegenApi(eintragId, aktuelleDauerSekunden, minuten) {
    const zusaetzlicheSekunden = minuten * 60;
    const neueDauer = (aktuelleDauerSekunden || 0) + zusaetzlicheSekunden;

    const { error } = await supabase
        .from("zeiterfassung")
        .update({ dauer_sekunden: neueDauer })
        .eq("id", eintragId);

    return !error;
}

export async function eintragSpeichernApi(bearbeitenEintrag) {
    if (!bearbeitenEintrag) return false;

    const { error } = await supabase
        .from("zeiterfassung")
        .update({
            ticket_nummer: Number(bearbeitenEintrag.ticket_nummer),
            prozess_name: bearbeitenEintrag.prozess_name,
            beschreibung: bearbeitenEintrag.beschreibung,
            prioritaet: bearbeitenEintrag.prioritaet,
            bereich: bearbeitenEintrag.bereich,
            deadline: bearbeitenEintrag.deadline || null,
            status: bearbeitenEintrag.status || "offen",
            fortlaufende_notizen: bearbeitenEintrag.fortlaufende_notizen,
            dauer_sekunden: Number(bearbeitenEintrag.dauer_sekunden || 0)
        })
        .eq("id", bearbeitenEintrag.id);

    if (error) {
        console.error("Fehler beim Aktualisieren des Eintrags:", error.message);
        return false;
    }
    return true;
}

export async function eintragLoeschenApi(id) {
    const { error } = await supabase.from("zeiterfassung").delete().eq("id", id);
    return !error;
}

export async function updateKanbanStatusApi(itemId, updateData) {
    const targetId = isNaN(Number(itemId)) ? itemId : Number(itemId);
    const { error } = await supabase.from("zeiterfassung").update(updateData).eq("id", targetId);
    if (error) {
        console.error("Fehler bei Drag&Drop Update:", error.message);
        return false;
    }
    return true;
}