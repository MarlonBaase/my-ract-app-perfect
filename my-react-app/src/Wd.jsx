import { Outlet, Link } from 'react-router-dom';
import { WD_TITLE, WD_NAV_ITEMS } from './services/wdService';

export default function Wd() {
  return (
    <div>
      <h2>{WD_TITLE}</h2>
      <nav>
        {WD_NAV_ITEMS.map((item) => (
          <Link key={item.path} to={item.path}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}