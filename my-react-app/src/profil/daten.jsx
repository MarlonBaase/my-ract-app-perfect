import { Outlet, Link } from 'react-router-dom'
import React, { useState, useEffect } from "react";

export default function daten() {

    const [inhalt, setInhalt] = useState("");

    useEffect(() => {
        fetch("/version.txt")
            .then((res) => res.text())
            .then((text) => setInhalt(text))
            .catch((err) => console.error("Fehler:", err));
    }, []);

    return <div><pre>{inhalt}</pre></div>;
}