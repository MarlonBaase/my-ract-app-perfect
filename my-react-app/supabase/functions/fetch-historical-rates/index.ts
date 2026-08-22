// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    // 1. Historischen Feed der EZB abrufen (enthält Daten ab 1999)
    const response = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml');
    if (!response.ok) throw new Error(`EZB HTTP Fehler: ${response.status}`);
    
    const xmlText = await response.text();

    // 2. XML nach Blöcken pro Datum parsen
    const cubeDateRegex = /<Cube time=['"]([^'"]+)['"]>([\s\S]*?)<\/Cube>/g;
    const rateRegex = /currency=['"]([^'"]+)['"]\s+rate=['"]([^'"]+)['"]/g;

    const dbPayload = [];
    let dateMatch;

    while ((dateMatch = cubeDateRegex.exec(xmlText)) !== null) {
      const currentDate = dateMatch[1];
      const blockContent = dateMatch[2];

      let rateMatch;
      while ((rateMatch = rateRegex.exec(blockContent)) !== null) {
        dbPayload.push({
          waehrungs_code: rateMatch[1],
          tageskurs_zu_eur: parseFloat(rateMatch[2]),
          datum_kurs: currentDate,
          quelle: 'EZB',
        });
      }
    }

    if (dbPayload.length === 0) {
      throw new Error('Keine historischen Wechselkurse gefunden.');
    }

    // 3. Supabase Client erstellen
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 4. Daten in Batches (Portionen) einfügen, um Speicher-Overhead zu vermeiden
    const BATCH_SIZE = 2000;
    let insertedCount = 0;

    for (let i = 0; i < dbPayload.length; i += BATCH_SIZE) {
      const batch = dbPayload.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('tageskurs')
        .upsert(batch, { onConflict: 'waehrungs_code,datum_kurs' });

      if (error) {
        throw new Error(`Fehler bei Batch ${i}: ${error.message}`);
      }
      insertedCount += batch.length;
    }

    return new Response(
      JSON.stringify({ success: true, totalRecords: insertedCount }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});