import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

const API_BASE = "https://picknpay-backend-5.onrender.com";

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

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-body">
      <div className="register-container">
      
        <img
          src="/Assets/Logo1.png"
          alt="PickNPay Logo"
          className="logo1-img"
        />

        
        <form className="register-form" onSubmit={handleRegister}>
         

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

          <div className="login-option">
            <span>Already have an account? </span>
            <Link to="/login" className="login-link">
              Login here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
