import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import API, { setAuthToken } from "@/lib/api";

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const switchToSignup = () => {
    navigate("/signup");
  };

  const login = async (e) => {
    e.preventDefault();
    setError(""); // clear previous errors

    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    try {
      const res = await API.post("/token", params);
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      setAuthToken(token);
      onLogin(); // update app state
      navigate("/"); // redirect to homepage
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid username or password.");
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center mt-50">
      <Card className="w-full max-w-sm ml-5 mr-5">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your username and password</CardDescription>
        </CardHeader>
        <form onSubmit={login}>
          <CardContent className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-9">
            <Button type="submit" className="w-full">Login</Button>
            <Button variant="link" onClick={switchToSignup}>Create an account</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
