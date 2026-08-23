import React, { useState } from 'react';
import { useEffect, useState, useContext, use } from "react";
import { supabase } from "../supabase";
import { handleApiError } from "../utils/errorHandler";

export default function Fremdwaehrung_stammdaten() {

  const [listeWaehrung, setListeWaehrung] = useState("")

  
  const ladeWaehrungen = async () => {
          const { data: { user } } = await supabase.auth.getUser()
          const { data, error } = await supabase
              .from("waehrungsstammdaten")
              .select(`waehrung_code, name, symbol`)
              .eq("asset.benutzer_id", user.id)
              .order('asset_name', { referencedTable: 'asset', ascending: true });
  
          if (handleApiError(error, "Festgeld laden")) return;
          if (data) setListeWaehrung(data)
      }
  
  const [searchTerm, setSearchTerm] = useState('');
  const items = listeWaehrung;

  const filteredItems = items.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
          const init = async () => {
              try {
                  await ladeWaehrungen()
              } catch (err) {
                  console.error("Fehler in init:", err);
              }
          };
          init();
      }, []);

  return (
    <div>
      <input
        type="text"
        placeholder="Suchen..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul>
        {filteredItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
