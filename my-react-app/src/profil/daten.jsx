import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function Daten() {
    const [inhalt, setInhalt] = useState("");

    useEffect(() => {
    fetch("../version.txt")
      .then((res) => res.text())
      .then((text) => setInhalt(text))
      .catch((err) => console.error("Fehler:", err));
  }, []);

  return <div><pre>{inhalt}</pre></div>;
}