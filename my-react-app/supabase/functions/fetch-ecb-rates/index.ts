// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    // 1. EZB XML-Daten abrufen
    const response = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');
    if (!response.ok) throw new Error(`EZB HTTP Fehler: ${response.status}`);
    
    const xmlText = await response.text();

    // 2. Datum auslesen
    const timeMatch = xmlText.match(/time=['"]([^'"]+)['"]/);
    const validDate = timeMatch ? timeMatch[1] : null;

    if (!validDate) {
      throw new Error('Datum konnte im XML nicht gefunden werden.');
    }

    // 3. Währungskurse per Regex extrahieren
    const rateRegex = /currency=['"]([^'"]+)['"]\s+rate=['"]([^'"]+)['"]/g;
    const dbPayload = [];
    let match;

    while ((match = rateRegex.exec(xmlText)) !== null) {
      dbPayload.push({
        waehrungs_code: match[1],
        tageskurs_zu_eur: parseFloat(match[2]),
        datum_kurs: validDate,
        quelle: 'EZB',
      });
    }

    if (dbPayload.length === 0) {
      throw new Error('Keine Wechselkurse im XML gefunden.');
    }

    console.log("Extrahierte Daten:", { datum: validDate, anzahl: dbPayload.length });

    // 4. Supabase Client erstellen
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL oder API-Key fehlt in den Umgebungsvariablen.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 5. Kurse in Tabelle eintragen/aktualisieren
    const { error } = await supabase
      .from('tageskurs')
      .upsert(dbPayload, { onConflict: 'waehrungs_code,datum_kurs' });

    if (error) {
      console.error("Datenbank-Fehler:", error);
      throw new Error(`Datenbank-Fehler: ${error.message} (${error.details ?? ''})`);
    }

    return new Response(
      JSON.stringify({ success: true, count: dbPayload.length, date: validDate }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err: any) {
    console.error("Edge Function Fehler:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});