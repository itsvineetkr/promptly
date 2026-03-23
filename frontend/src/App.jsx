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

  // Debug effect to track login state changes only after initial load
  useEffect(() => {
    if (!isLoading) {
      console.log("Login state:", loggedIn);
    }
  }, [loggedIn, isLoading]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={<LoginForm onLogin={() => setLoggedIn(true)} />}
        />
        <Route
          path="/signup"
          element={<SignupForm switchToLogin={() => window.location.replace('/login')} />}
        />
        <Route
          path="/profile"
          element={loggedIn ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/integrate"
          element={loggedIn ? <ChatbotIntegration /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;