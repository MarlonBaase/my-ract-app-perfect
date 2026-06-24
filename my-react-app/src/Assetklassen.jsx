import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate, Outlet } from 'react-router-dom'
import { StrictMode, useEffect, useState } from 'react'
import { supabase } from './supabase'
import Lf from './Lf.jsx'
import Wd from './Wd.jsx'

export default function Assetklassen() {
  return (
    <div>
      <h1>Products Page</h1>
      
        <nav>
          <Link to="lf">Geldmarkt & Liquidität</Link> |{" "}
          <Link to="wd">Wertpapiere</Link> |{" "}
          <Link to="wd">Derivate, Hebel- & Strukturierte Produkte</Link> |{" "}
          <Link to="lf">Immobilien</Link> |{" "}
          <Link to="lf">Sachwerte & Rohstoffe</Link> |{" "}
          <Link to="lf">Digitale Assets & Web3</Link> |{" "}
          <Link to="lf">Geschäftliches & Immaterielles</Link> |{" "}
          <Link to="lf">Versicherungen & Vorsorge</Link> |{" "}
          <Link to="lf">Forderungen & Guthaben-Punkte</Link> |{" "}
          <Link to="lf">Kredite & Finanzierungen</Link> |{" "}
          <Link to="lf">Persönlich angelegte</Link>
        </nav>
       <Outlet/> 
    </div>

  )
}