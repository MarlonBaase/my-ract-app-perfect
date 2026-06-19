import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { StrictMode, useEffect, useState } from 'react'
import { supabase } from './supabase'
import Lf from './Lf'

export default function Assetklassen() {
  return (
    <div>
      <h1>Products Page</h1>
      <BrowserRouter>
        <nav>
          <Link to="lf">Liquidität & Forderungen</Link> |{" "}
        </nav>
        <Routes>
          <Route path='lf' element={<Lf />} />
        </Routes>
      </BrowserRouter>
    </div>

  )
}