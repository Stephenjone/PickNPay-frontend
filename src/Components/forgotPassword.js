import React, { useState } from 'react';
import { REACT_API_URL } from '../actionTypes/authActionTypes';
import './forgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${REACT_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid response from server. Check backend.");
      }

      if (!res.ok) throw new Error(data.error || 'Error sending reset link');

      setMsg(data.message || "Reset link sent successfully!");
      setEmail("");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-body">
      <div className="login-container">
        {/* Logo */}
        <img
          src="/Assets/Logo1.png"
          alt="PickNPay Logo"
          className="logo1-img"
        />

        {/* Forgot Password Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Forgot Password</h2>

          <input
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          {msg && <p className="success">{msg}</p>}
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
