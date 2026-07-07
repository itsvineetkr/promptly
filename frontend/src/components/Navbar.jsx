import { Link, NavLink, useNavigate } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 text-sm transition-colors ${
    isActive ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
  }`;

export function NavigationBar({ loggedIn, onLogout }) {
  const navigate = useNavigate();

  const logout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center bg-neutral-900 font-mono text-xs font-bold text-white">
            P
          </span>
          <span className="text-sm font-semibold tracking-tight">Promptly</span>
        </Link>

        <div className="flex items-center gap-1">
          {loggedIn ? (
            <>
              <NavLink to="/integrate" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
              <button
                onClick={logout}
                className="ml-2 border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <Link
                to="/signup"
                className="ml-2 bg-neutral-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-neutral-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
