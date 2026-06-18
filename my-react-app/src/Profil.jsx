import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Profil() {

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/home"
  }

  return (
    <div>
      <h1>Profil</h1>
      <div>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}