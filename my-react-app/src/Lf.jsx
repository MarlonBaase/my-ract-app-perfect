import { Outlet, Link } from 'react-router-dom'

export default function Lf() {
  return (
    <div>
      <h2>Liquidität & Forderungen</h2>
      <nav>
        <Link to="girokonto">Girokonto</Link>
        <Link to="tagesgeld">Tagesgeldkonto</Link>
      </nav>
      <Outlet />
    </div>
  )
}