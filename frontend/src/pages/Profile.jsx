import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import API from "@/lib/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    API.get("/users/me/").then((res) => {
      setUser(res.data);
      setForm(res.data);
    });
  }, []);

  const updateProfile = async () => {
    await API.put("/users/me/", form);
    alert("Profile updated");
    setEditing(false);
  };

  if (!user) return null;

  return (
    <div className="flex items-center justify-center mt-30">
      <Card className="w-full max-w-sm ml-5 mr-5">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {["username", "email", "full_name", "password"].map((field) => (
            <div className="grid gap-2" key={field}>
              <Label htmlFor={field}>{field.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</Label>
              <Input
                id={field}
                type={field === "password" ? "password" : "text"}
                value={form[field] || ""}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                disabled={!editing && field !== "password"}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" onClick={editing ? updateProfile : () => setEditing(true)}>
            {editing ? "Save Changes" : "Edit Profile"}
          </Button>
          <Button variant="destructive" className="w-full" onClick={() => {
            localStorage.removeItem("token");
            location.reload();
          }}>
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
