// src/pages/Login.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import { REACT_API_URL } from '../actionTypes/authActionTypes';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill all the fields!");
      setLoading(false);
      return;
    }

    if (!REACT_API_URL) {
      console.error("REACT_API_URL is not defined!");
      setError("Internal error: API URL not set.");
      setLoading(false);
      return;
    }

    try {
      console.log("Using backend URL:", REACT_API_URL);
      const res = await fetch(`${REACT_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      console.log("Production raw response from server:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Server did not return valid JSON.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      setSuccess(data.message || "Login successful!");
      setEmail("");
      setPassword("");

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-body">
      <div className="content-wrapper">
        <img
          src="/Assets/Logo1.png" 
          alt="PickNPay Logo"
          className="logo1-img"
        />

        <form className="login-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <div className="register-option">
            <span className="not-registered-yet">Not registered yet? </span>
            <Link to="/register" className="register">Register here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
