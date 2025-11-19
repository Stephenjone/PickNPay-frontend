import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { REACT_API_URL } from "../actionTypes/authActionTypes"; 
import "./Register.css";

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

    if (!name || !email || !password) {
      setError("Please fill all the fields!");
      return;
    }

    if (!REACT_API_URL) {
      console.error("REACT_API_URL is not defined!");
      setError("Internal error: API URL not set.");
      return;
    }

    setLoading(true);
    try {
      console.log("Using backend URL:", REACT_API_URL);
      const res = await fetch(`${REACT_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const text = await res.text();
      console.log("Raw register response:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid response from server. Check backend.");
      }

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setSuccess(data.message || "Registration successful!");
      setName("");
      setEmail("");
      setPassword("");

      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error("Register error:", err);
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

        {/* Register Form */}
        <form className="login-form" onSubmit={handleRegister}>
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
          {success && <p className="success">{success}</p>}

          <div className="register-option">
            <span>Already have an account? </span>
            <Link to="/login" className="register">
              Login here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
