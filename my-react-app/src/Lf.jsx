import { Outlet, Link } from 'react-router-dom'

export default function Lf() {
  return (
    <div>
      <h2>Liquidität & Forderungen</h2>
      <nav>
        <Link to="lf_Dashboard">Dashboard</Link>
        <Link to="girokonto">Girokonto</Link>
        <Link to="tagesgeld">Tagesgeldkonto</Link>
        <Link to="festgeld">Festgeld / Sparbrief</Link>
        <Link to="geldmarktfonds">Geldmarktfonds</Link>
        <Link to="fremdwaehrungskonto">Fremdwährungskonto</Link>
      </nav>
      <Outlet />
    </div>
  )
}