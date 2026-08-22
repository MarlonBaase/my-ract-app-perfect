import { parseStringPromise } from 'xml2js';
import { supabase } from '../supabase.js';

const ECB_XML_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

export async function fetchAndSaveEcbRates() {
  try {
    const response = await fetch(ECB_XML_URL);
    if (!response.ok) throw new Error(`HTTP-Fehler! Status: ${response.status}`);
    const xmlText = await response.text();

    const parsedXml = await parseStringPromise(xmlText);
    const timeCube = parsedXml['gesmes:Envelope'].Cube[0].Cube[0];
    const validDate = timeCube.$.time;
    const currencyCubes = timeCube.Cube;

    

    // Spaltennamen exakt an deine Supabase-Tabelle angepasst
    const dbPayload = currencyCubes.map(item => ({
      waehrungs_code: item.$.currency,
      tageskurs_zu_eur: parseFloat(item.$.rate),
      datum_kurs: validDate,
      quelle: 'EZB'
    }));

    
    const { data, error } = await supabase
      .from('tageskurs')
      .upsert(dbPayload, { onConflict: 'waehrungs_code,datum_kurs' });

    if (error) throw error;

    console.log(`Erfolgreich ${dbPayload.length} EZB-Kurse für den ${validDate} in Supabase gespeichert!`);
    return { success: true, count: dbPayload.length, date: validDate };

  } catch (error) {
    console.error('Detaillierter Fehler:', error);
    return { success: false, error: error.message };
  }
}