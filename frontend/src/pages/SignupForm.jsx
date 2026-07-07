import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { setAuthToken } from "@/lib/api";
import { Spinner, FormError, parseApiError } from "@/pages/LoginForm";

const FIELDS = [
  { name: "full_name", label: "Full name", type: "text", autoComplete: "name" },
  { name: "username", label: "Username", type: "text", autoComplete: "username" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
];

export default function SignupForm({ onLogin }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      return "Please fill in all the fields.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }
    if (form.password.length < 8 || !/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)) {
      return "Password must be at least 8 characters and contain both letters and numbers.";
    }
    return "";
  };

  const signup = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await API.post("/users/", {
        ...form,
        username: form.username.trim(),
        email: form.email.trim(),
      });

      // Account created — log in right away with the same credentials
      const params = new URLSearchParams();
      params.append("username", form.username.trim());
      params.append("password", form.password);
      const res = await API.post("/token", params);
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      setAuthToken(token);
      onLogin();
      navigate("/integrate");
    } catch (err) {
      setError(parseApiError(err, "Something went wrong while creating your account. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col px-6 pt-24 pb-16">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
        Get started
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create your account</h1>

      <form onSubmit={signup} noValidate className="mt-8 space-y-5">
        <FormError message={error} />

        {FIELDS.map(({ name, label, type, autoComplete }) => (
          <div className="space-y-1.5" key={name}>
            <label htmlFor={name} className="text-sm font-medium">
              {label}
            </label>
            <input
              id={name}
              name={name}
              type={type}
              autoComplete={autoComplete}
              value={form[name]}
              onChange={handleChange}
              className="h-10 w-full border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-neutral-900"
            />
            {name === "password" && (
              <p className="text-xs text-neutral-400">
                At least 8 characters, with letters and numbers.
              </p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="flex h-10 w-full items-center justify-center gap-2 bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
        >
          {submitting && <Spinner />}
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-500">
        Already have an account?{" "}
        <Link to="/login" className="text-neutral-900 underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}
