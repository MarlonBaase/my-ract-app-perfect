import { Outlet, Link } from 'react-router-dom'

export default function Lf() {
  return (
    <div>
      <h2>Liquidität & Forderungen</h2>
      <nav>
        <Link to="girokonto">Girokonto</Link>
      </nav>
      <Outlet />
    </div>
  )
}