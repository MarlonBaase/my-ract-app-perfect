import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Profil({ darkMode, setDarkMode }) {

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "https://my-ract-app-perfect.vercel.app/"
  }

  return (
    <div>
      <h1>Profil</h1>
      <button onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
      <div>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}