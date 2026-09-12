import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import ProfilSidebar from './ProfilSidebar';
import { 
  PROFIL_LAYOUT_CONFIG, 
  getSidebarToggleLeft 
} from './services/profilService';

export default function Profil({ darkMode }) {
  const [sidebarOffen, setSidebarOffen] = useState(true);

  return (
    <div style={{ display: "flex" }}>
      
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOffen(!sidebarOffen)}
        style={{
          position: "fixed",
          bottom: PROFIL_LAYOUT_CONFIG.toggleButtonBottom,
          left: getSidebarToggleLeft(sidebarOffen),
          zIndex: 999,
          backgroundColor: PROFIL_LAYOUT_CONFIG.toggleButtonColor,
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
      <div 
        style={{ 
          flex: 1, 
          overflowY: "auto", 
          paddingLeft: PROFIL_LAYOUT_CONFIG.contentPaddingLeft, 
          paddingTop: PROFIL_LAYOUT_CONFIG.contentPaddingTop 
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}