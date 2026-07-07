import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { setAuthToken } from "@/lib/api";

export function Spinner({ className = "" }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px] ${className}`}
      aria-hidden="true"
    />
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="border border-neutral-900 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900"
    >
      <span className="mr-2 font-mono text-xs font-bold">!</span>
      {message}
    </div>
  );
}

export function parseApiError(err, fallback) {
  if (!err.response) {
    return "Could not reach the server. Check your connection and try again.";
  }
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    // FastAPI validation errors
    return detail
      .map((d) => d.msg?.replace(/^Value error,\s*/i, ""))
      .filter(Boolean)
      .join(" ");
  }
  return fallback;
}

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    const params = new URLSearchParams();
    params.append("username", username.trim());
    params.append("password", password);

    setSubmitting(true);
    try {
      const res = await API.post("/token", params);
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      setAuthToken(token);
      onLogin();
      navigate("/integrate");
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Incorrect username or password.");
      } else {
        setError(parseApiError(err, "Something went wrong while logging in. Please try again."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col px-6 pt-24 pb-16">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
        Welcome back
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Log in</h1>

      <form onSubmit={login} noValidate className="mt-8 space-y-5">
        <FormError message={error} />

        <div className="space-y-1.5">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-10 w-full border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-neutral-900"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-neutral-900"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex h-10 w-full items-center justify-center gap-2 bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
        >
          {submitting && <Spinner />}
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-500">
        No account yet?{" "}
        <Link to="/signup" className="text-neutral-900 underline underline-offset-4">
          Create one
        </Link>
      </p>
    </div>
  );
}
