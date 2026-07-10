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
          <a
            href="https://github.com/itsvineetkr/promptly"
            target="_blank"
            rel="noopener noreferrer"
            title="View the source on GitHub"
            className="mr-1 flex h-8 w-8 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900"
          >
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
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
