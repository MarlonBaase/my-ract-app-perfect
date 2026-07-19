import { Outlet } from 'react-router-dom'
import AssetSidebar from './AssetSidebar'
import { useState, useEffect } from 'react'

export default function Assetklassen({ darkMode }) {
  // Erkennt, ob es ein Mobilgerät ist (Bildschirmbreite < 900px)
  const [istMobil, setIstMobil] = useState(window.innerWidth < 900)
  // Auf dem Handy standardmäßig zu, auf dem Desktop offen
  const [sidebarOffen, setSidebarOffen] = useState(window.innerWidth >= 900)

  useEffect(() => {
    const handleResize = () => {
      const mobil = window.innerWidth < 900
      setIstMobil(mobil)
      // Wenn man das Fenster am PC zieht, bricht es automatisch um
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Dynamische Styles je nach Bildschirmgröße
  const layoutStyle = {
    display: "flex",
    flexDirection: istMobil ? "column" : "row", // Auf dem Handy untereinander
    minHeight: "100vh"
  }

  const inhaltStyle = {
    flex: 1,
    overflowY: "auto",
    paddingLeft: istMobil ? "15px" : "50px",  // Weniger Abstand am Handy
    paddingRight: istMobil ? "15px" : "20px",
    paddingTop: "50px"
  }

  const buttonStyle = {
    position: "fixed",
    bottom: "70px",
    // Wenn mobil, klebt der Button am Rand, sonst orientiert er sich an der Sidebar
    left: sidebarOffen && !istMobil ? "248px" : "0px", 
    zIndex: 999,
    backgroundColor: "#4F6EF7",
    color: "white",
    border: "none",
    borderRadius: "0 8px 8px 0",
    padding: "0.5rem 0.4rem",
    cursor: "pointer",
    fontSize: "0.75rem",
    transition: "left 0.2s",
  }

  return (
    <div style={layoutStyle}>
      
      {/* Toggle Button */}
      <button onClick={() => setSidebarOffen(!sidebarOffen)} style={buttonStyle}>
        {sidebarOffen ? "◀" : "▶"}
      </button>

      {/* Sidebar */}
      {sidebarOffen && <AssetSidebar darkMode={darkMode} />}

      {/* Inhalt */}
      <div style={inhaltStyle}>
        <Outlet />
      </div>
    </div>
  )
}