import { Outlet } from 'react-router-dom';
import { getGirokontoLayoutTitle } from '../services/girokontoService';

export default function Girokonto() {
  const pageTitle = getGirokontoLayoutTitle();

  return (
    <div>
      <h2>{pageTitle}</h2>
      <Outlet />
    </div>
  );
}