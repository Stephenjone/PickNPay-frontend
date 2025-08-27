// src/components/Login.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Login.css';

const API_BASE = "https://picknpay-backend-3.onrender.com"; // 🔑 Render backend URL

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid response from server. Check backend.");
      }

      if (!res.ok) throw new Error(data.error || "Login failed");

      // ✅ Save user to AuthContext + localStorage
      login(data.email, data.name);

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-body">
      <div className="content-wrapper">
        <div className="logo-container">
          <img src="/Images/Catalyst.png" alt="Logo" className="logo-img" />
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Login</h2>
          <input type="email" placeholder="Enter your Email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Enter your Password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Login</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
