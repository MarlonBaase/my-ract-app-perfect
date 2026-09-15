import React, { useState } from "react";

export function FremdwaehrungListe({ waehrungen, onSelectWaehrung }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtert die Liste basierend auf Code oder Name
  const gefilterteWaehrungen = waehrungen.filter((w) => {
    const query = searchTerm.toLowerCase();
    const code = w.waehrungs_code?.toLowerCase() || "";
    const name = w.name?.toLowerCase() || "";
    return code.includes(query) || name.includes(query);
  });

  return (
    <div className="space-y-4">
      {/* Suchfeld */}
      <input
        type="text"
        placeholder="Währung suchen (z.B. USD, Dollar)..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Gefilterte Liste */}
      <ul className="divide-y divide-gray-200 border rounded-lg bg-white shadow-sm">
        {gefilterteWaehrungen.length > 0 ? (
          gefilterteWaehrungen.map((w) => (
            <li
              key={w.waehrungs_code}
              onClick={() => onSelectWaehrung(w.waehrungs_code)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
            >
              <span className="font-medium">{w.waehrungs_code}</span>
              <span className="text-gray-500 text-sm">{w.name}</span>
            </li>
          ))
        ) : (
          <li className="px-4 py-4 text-center text-gray-500">
            Keine passenden Währungen gefunden.
          </li>
        )}
      </ul>
    </div>
  );
}