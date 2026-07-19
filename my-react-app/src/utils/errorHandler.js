// utils/errorHandler.js
export const handleApiError = (error, context = "Operation") => {
  if (!error) return false;

  console.error(`[Fehler bei ${context}]:`, error);

  // Hier kannst du eine "gescheite", benutzerfreundliche Meldung bauen
  let clientMessage = "Ein unerwarteter Fehler ist aufgetreten.";

  if (error.message.includes("JWT")) {
    clientMessage = "Deine Sitzung ist abgelaufen. Bitte melde dich neu an.";
  } else if (error.code === "PGRST116") {
    clientMessage = "Die angeforderten Daten wurden nicht gefunden.";
  } else if (error.message.includes("violates row-level security")) {
    clientMessage = "Du hast keine Berechtigung für diese Aktion.";
  } else if (error.message) {
    clientMessage = error.message; // Fallback auf die DB-Meldung
  }

  // Hier könntest du statt einem alert() auch ein schickes Toast-Plugin nutzen (z.B. react-toastify)
  alert(`⚠️ ${clientMessage}`); 
  
  return true;
};