import { Outlet } from 'react-router-dom'
import AssetSidebar from './AssetSidebar'

export default function Assetklassen({ darkMode }) {
  return (
    <div style={{ display: "flex" }}>
      <AssetSidebar darkMode={darkMode} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Outlet />
      </div>
    </div>
  )
}