import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "@/lib/api";
import { Spinner, FormError, parseApiError } from "@/pages/LoginForm";

const FIELDS = [
  { name: "full_name", label: "Full name", type: "text" },
  { name: "username", label: "Username", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "password", label: "New password", type: "password" },
];

export default function Profile({ onLogout }) {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/users/me/")
      .then((res) => {
        setUser(res.data);
        setForm({ ...res.data, password: "" });
      })
      .catch(() => setError("Couldn't load your profile. Please try logging in again."));
  }, []);

  const updateProfile = async () => {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await API.put("/users/me/", payload);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(parseApiError(err, "Couldn't save your changes. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    onLogout();
    navigate("/");
  };

  if (!user && !error) {
    return (
      <div className="flex justify-center pt-24">
        <Spinner className="text-neutral-400" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-6 pt-24 pb-16">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
        Account
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Profile</h1>

      <div className="mt-8 space-y-5">
        <FormError message={error} />
        {saved && (
          <div className="border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
            Profile updated.
          </div>
        )}

        {user &&
          FIELDS.map(({ name, label, type }) => (
            <div className="space-y-1.5" key={name}>
              <label htmlFor={name} className="text-sm font-medium">
                {label}
              </label>
              <input
                id={name}
                type={type}
                placeholder={name === "password" ? "Leave blank to keep current" : ""}
                value={form[name] || ""}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                disabled={!editing}
                className="h-10 w-full border border-neutral-300 bg-white px-3 text-sm outline-none transition-colors focus:border-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-500"
              />
            </div>
          ))}

        {user && (
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={editing ? updateProfile : () => setEditing(true)}
              disabled={saving}
              className="flex h-10 w-full items-center justify-center gap-2 bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
            >
              {saving && <Spinner />}
              {editing ? (saving ? "Saving…" : "Save changes") : "Edit profile"}
            </button>
            {editing && (
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({ ...user, password: "" });
                  setError("");
                }}
                className="h-10 w-full border border-neutral-300 text-sm transition-colors hover:border-neutral-900"
              >
                Cancel
              </button>
            )}
            <button
              onClick={logout}
              className="h-10 w-full border border-neutral-300 text-sm text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
