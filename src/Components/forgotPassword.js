// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { REACT_API_URL } from '../actionTypes/authActionTypes';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    try {
      const res = await fetch(`${REACT_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error sending reset link');

      setMsg(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-body">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>
        <input
          type="email"
          placeholder="Enter your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>

        {msg && <p className="success">{msg}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default ForgotPassword;
