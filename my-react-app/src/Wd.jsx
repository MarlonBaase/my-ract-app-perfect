import { Outlet, Link } from 'react-router-dom'

export default function Wd() {
  return (
    <div>
      <h2>Wertpapier</h2>
      <nav>
        <Link to="wd_Daschboard">Dashboard</Link>
        <Link to="aktien">Aktien</Link>
        <Link to="etf">ETFs</Link>
        <Link to="publikumfonds">aktive Publikumsfonds</Link>
        <Link to="anleihen">Anleihen</Link>
        <Link to="mitarbeiteraktien">Mitarbeiteraktien</Link>
        <Link to="genossenschaft">Genossenschaftsanteile</Link>
      </nav>
      <Outlet />
    </div>
  )
}