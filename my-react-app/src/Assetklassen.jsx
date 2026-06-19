import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate, Outlet } from 'react-router-dom'
import { StrictMode, useEffect, useState } from 'react'
import { supabase } from './supabase'
import Lf from './Lf.jsx'

export default function Assetklassen() {
  return (
    <div>
      <h1>Products Page</h1>
      
        <nav>
          <Link to="lf">Liquidität & Forderungen</Link> |{" "}
          <Link to="lf">Wertpapiere & Derivate</Link> |{" "}
          <Link to="lf">Immobilien</Link> |{" "}
          <Link to="lf">Krypto & Web3</Link> |{" "}
          <Link to="lf">Sachwerte & Edelmetalle</Link> |{" "}
          <Link to="lf">Geschäftliches & Immaterielles</Link> |{" "}
          <Link to="lf">Versicherungen, Vorsorge & Verbindlichkeiten</Link>
        </nav>
       <Outlet/> 
    </div>

  )
}