import { Outlet } from 'react-router-dom'
import ProfilSidebar from './ProfilSidebar'
import { useState } from 'react'

export default function Profil({ darkMode }) {
  const [sidebarOffen, setSidebarOffen] = useState(true)

  return (
    <div style={{ display: "flex" }}>
      
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOffen(!sidebarOffen)}
        style={{
          position: "fixed",
          bottom: "70px",
          left: sidebarOffen ? "248px" : "0px",
          zIndex: 999,
          backgroundColor: "#4F6EF7",
          color: "white",
          border: "none",
          borderRadius: "0 8px 8px 0",
          padding: "0.5rem 0.4rem",
          cursor: "pointer",
          fontSize: "0.75rem",
          transition: "left 0.2s",
        }}
      >
        {sidebarOffen ? "◀" : "▶"}
      </button>

      {/* Sidebar */}
      {sidebarOffen && <ProfilSidebar darkMode={darkMode} />}

      {/* Inhalt */}
      <div style={{ flex: 1, overflowY: "auto" , paddingLeft: "50px" , paddingTop: "50px"}}>
        <Outlet />
      </div>
    </div>
  )
}