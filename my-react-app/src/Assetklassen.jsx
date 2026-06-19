import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import LF from './LF'

export default function Assetklassen() {
  return(
    <div>
      <h1>Products Page</h1>
    <BrowserRouter>
      <nav>
        <Link to="/lf">Liquidität & Forderungen</Link> |{" "}
      </nav>
      <Routes>
        <Route path="/lf" element={<LF />} />
      </Routes>
    </BrowserRouter>
    </div>
    
  )
}