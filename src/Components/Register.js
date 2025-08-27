// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!name || !email || !password) {
      setError("Please fill all the fields!");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim(), 
          password 
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned an invalid response. Check if backend is running.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // ✅ Store user details
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", name.trim());
      localStorage.setItem("userEmail", email.trim());

      setSuccess(data.message || "Registration successful!");
      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(err.message || "Unexpected error during registration.");
    } finally {
      setLoading(false);
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
          <input
            type="text"
            placeholder="Enter your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            {loading ? "Registering..." : "Register"}
          </button>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success} Redirecting to login...</p>}
        </form>
      </div>
    </div>
  );
};

export default Register;
