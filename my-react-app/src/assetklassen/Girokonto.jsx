import { Outlet } from 'react-router-dom';
import Navbar from '../fremd_navbar';
import { getGirokontoLayoutTitle } from '../services/girokontoService';

export default function Girokonto() {
  const pageTitle = getGirokontoLayoutTitle();

  return (
    <div>
      <Navbar />
      <h2>{pageTitle}</h2>
      <Outlet />
    </div>
  );
}