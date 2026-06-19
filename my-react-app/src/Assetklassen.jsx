import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';

export default function Assetklassen() {
  return (
    <div>
      <h1>Products Page</h1>
        <nav>
          <Link to="/assetklassen/lf">Liquidität & Forderungen</Link> |{" "}
        </nav>
        <Outlet/>
    </div>

  )
}