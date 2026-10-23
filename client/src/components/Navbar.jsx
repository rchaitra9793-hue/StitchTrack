import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isLoggedIn, logout } from '../api.js';

export default function Navbar() {
  const navigate = useNavigate();
  useLocation(); // re-render on route change so login state stays fresh

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-stone-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-rose-600">
          ✂️ Stitch Track
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/order" className="hover:text-rose-600">New Order</Link>
          <Link to="/track" className="hover:text-rose-600">Track</Link>
          {isLoggedIn() ? (
            <>
              <Link to="/dashboard" className="hover:text-rose-600">Dashboard</Link>
              <button onClick={handleLogout} className="text-stone-500 hover:text-rose-600">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-rose-600">Owner Login</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
