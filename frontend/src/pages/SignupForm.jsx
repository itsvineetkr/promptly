import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import API from "@/lib/api";

export default function SignupForm({ switchToLogin }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const signup = async (e) => {
    e.preventDefault();
    await API.post("/users/", form);
    switchToLogin();
  };

  return (
    <div className="flex items-center justify-center mt-30">
      <Card className="w-full max-w-sm ml-5 mr-5">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Fill in the details to register</CardDescription>
        </CardHeader>
        <form onSubmit={signup}>
          <CardContent className="space-y-4">
            {["username", "email", "full_name", "password"].map((field) => (
              <div className="grid gap-2" key={field}>
                <Label htmlFor={field}>{field.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</Label>
                <Input
                  id={field}
                  type={field === "password" ? "password" : "text"}
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-9">
            <Button type="submit" className="w-full">Sign Up</Button>
            <Button variant="link" onClick={switchToLogin}>Already have an account? Login</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}