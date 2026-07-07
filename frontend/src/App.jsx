import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginForm from "@/pages/LoginForm";
import SignupForm from "@/pages/SignupForm";
import Profile from "@/pages/Profile";
import Home from "@/pages/Home";
import ChatbotIntegration from "./pages/Integration";
import { NavigationBar } from "./components/Navbar";
import { setAuthToken } from "@/lib/api";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      setLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => setLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    setLoggedIn(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
          Loading
        </span>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white text-neutral-900">
        <NavigationBar loggedIn={loggedIn} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home loggedIn={loggedIn} />} />
          <Route
            path="/login"
            element={loggedIn ? <Navigate to="/integrate" replace /> : <LoginForm onLogin={handleLogin} />}
          />
          <Route
            path="/signup"
            element={loggedIn ? <Navigate to="/integrate" replace /> : <SignupForm onLogin={handleLogin} />}
          />
          <Route
            path="/profile"
            element={loggedIn ? <Profile onLogout={handleLogout} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/integrate"
            element={loggedIn ? <ChatbotIntegration /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
