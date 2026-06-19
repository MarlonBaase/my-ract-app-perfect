import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import LF from './LF'

export default function Assetklassen() {
  return(
    <div>
      <h1>Products Page</h1>
    <BrowserRouter>
      <nav>
        <Link to="/LF">Liquidität & Forderungen</Link> |{" "}
        <Link to="/Assetklassen/car">Wertpapiere & Derivate</Link> |{" "}
        <Link to="/Assetklassen/car">Immobilien</Link> |{" "}
        <Link to="/Assetklassen/car">Krypto & Web3</Link> |{" "}
        <Link to="/Assetklassen/car">Sachwerte & Edelmetalle</Link> |{" "}
        <Link to="/Assetklassen/car">Geschäftliches & Immaterielles</Link> |{" "}
        <Link to="/Assetklassen/car">Versicherungen, Vorsorge & Verbindlichkeiten</Link> 
      </nav>
      <Routes>
        <Route path="/LF" element={<LF />} />
      </Routes>
    </BrowserRouter>
    </div>
    
  )
}