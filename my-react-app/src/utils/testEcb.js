import { fetchAndSaveEcbRates } from './fetchExchangeRates.js';

async function test() {
  console.log("Starte EZB-Abruf und Speicherung in Supabase...");
  const ergebnis = await fetchAndSaveEcbRates();
  console.log("Ergebnis:", JSON.stringify(ergebnis, null, 2));
}

test();