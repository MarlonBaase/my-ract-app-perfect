import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import Dashboard from './Dashboard';
import Assetklassen from './Assetklassen';
import Haushaltsbuch from './Haushaltsbuch';
import Profil from './Profil';
import Simulation from './Simulation';
import Support from './Support';
import './index.css'



function App() {
  return (
    <BrowserRouter>
      {/* Navigation */}
      <nav>
        <Link to="/home">Home</Link> |{" "}
        <Link to="/dashboard">Dashboard</Link> |{" "}
        <Link to="/haushaltsbuch">Haushaltsbuch</Link> |{" "}
        <Link to="/assetklassen">Assetklassen</Link> |{" "}
        <Link to="/simulation">Simulation</Link> |{" "}
        <Link to="/profil">Profil</Link> |{" "}
        <Link to="/support">Support</Link>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assetklassen" element={<Assetklassen />} />
        <Route path="/haushaltsbuch" element={<Haushaltsbuch />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/support" element={<Support />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <App />
)