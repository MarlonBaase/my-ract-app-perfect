import { Outlet } from 'react-router-dom';
import Navbar from '../fremd_navbar';
import { getFremdwaehrungLayoutTitle } from '../services/fremdwaehrungService';

export default function Fremdwaehrung() {
  const pageTitle = getFremdwaehrungLayoutTitle();

  return (
    <div>
      <Navbar />
      <h2>{pageTitle}</h2>
      <Outlet />
    </div>
  );
}