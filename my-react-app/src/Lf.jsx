import { Outlet } from 'react-router-dom';
import { getLfLayoutTitle } from './services/lfService';

export default function Lf() {
  const pageTitle = getLfLayoutTitle();

  return (
    <div>
      <h2>{pageTitle}</h2>
      <Outlet />
    </div>
  );
}