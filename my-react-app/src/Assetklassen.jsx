import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, Navigate, Outlet } from 'react-router-dom'
import { StrictMode, useEffect, useState } from 'react'
import { supabase } from './supabase'
import Lf from './Lf.jsx'
import Wd from './Wd.jsx'
import AssetSidebar from './AssetSidebar.jsx'
import './index.css'

export default function Assetklassen() {
    return (
    <div style={{ display: "flex" }}>
      <AssetSidebar darkMode={darkMode} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Outlet />
      </div>
    </div>

  )
}