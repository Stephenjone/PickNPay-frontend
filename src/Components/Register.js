// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const API_BASE = "https://picknpay-backend-3.onrender.com"; // 🔑 Render backend URL

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("Please fill all the fields!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid response from server. Check backend.");
      }

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setSuccess(data.message);
      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-body">
      <div className="content-wrapper">
        <div className="logo-container">
          <img src="/Images/Catalyst.png" alt="Logo" className="logo-img" />
        </div>
        <form className="register-form" onSubmit={handleRegister}>
          <h2>Register</h2>
          <input type="text" placeholder="Enter your Name"
            value={name} onChange={(e) => setName(e.target.value)} />
          <input type="email" placeholder="Enter your Email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Enter your Password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Register</button>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success} Redirecting...</p>}
        </form>
      </div>
    </div>
  );
};

export default Register;
