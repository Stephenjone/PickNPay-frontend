import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { REACT_API_URL } from "../actionTypes/authActionTypes";
import { requestForToken } from "./firebase";

import "./Login.css";

const Login = ({ setCurrentUserEmail }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Splash screen
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500); // Faster splash
    return () => clearTimeout(timer);
  }, []);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill all the fields!");
      return;
    }

    setLoading(true);

    try {
      // 🔥 Removed artificial 5-second delay
      const res = await fetch(`${REACT_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");

      // Save token & user
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      const userEmail = data?.user?.email;

      if (userEmail && typeof setCurrentUserEmail === "function") {
        setCurrentUserEmail(userEmail);
      }

      setSuccess(data.message || "Login successful!");
      setEmail("");
      setPassword("");

      // Register FCM token (non-blocking)
      if (userEmail) {
        requestForToken(userEmail).catch(() =>
          console.warn("FCM registration failed")
        );
      }

      // Fast redirect
      setTimeout(() => navigate("/dashboard"), 300);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // SPLASH
  if (showSplash) {
    return (
      <div className="splash-screen">
        <img src="/Assets/Logo1.png" className="splash-logo" alt="PickNPay" />
      </div>
    );
  }

  // LOGIN UI
  return (
    <div className="login-body">
      <div className="login-container">
        <img src="/Assets/Logo1.png" alt="PickNPay Logo" className="logo1-img" />

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button type="submit" disabled={loading}>
            {loading ? (
              <div className="chef-loader">
                <div className="chef-hat"></div>
                <div className="chef-pan"></div>
              </div>
            ) : (
              "Login"
            )}
          </button>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <div className="register-option">
            <span>Not registered yet? </span>
            <Link to="/register" className="register">
              Register here
            </Link>
          </div>

          <div className="forgot-password-link" style={{ textAlign: "center" }}>
            <Link to="/resetpassword">Forgot Password?</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
