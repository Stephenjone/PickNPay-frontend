import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { REACT_API_URL } from "../actionTypes/authActionTypes";
import { requestForToken } from "./firebase"; // ✅ Import FCM helper
import "./Login.css";

const Login = ({ setCurrentUserEmail }) => {
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
      setError("Internal error: API URL not set.");
      setLoading(false);
      return;
    }

    try {
      console.log("🌐 Using backend URL:", REACT_API_URL);
      const res = await fetch(`${REACT_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      console.log("🔹 Raw response:", text);

      const data = JSON.parse(text);

      if (!res.ok) throw new Error(data.error || "Login failed.");

      setSuccess(data.message || "Login successful!");
      setEmail("");
      setPassword("");

      // ✅ Save token + user info
      localStorage.setItem("token", data.token);
      if (data.user) {
        try {
          localStorage.setItem("user", JSON.stringify(data.user));
        } catch (err) {
          console.warn("Could not save user to localStorage:", err);
        }
      }
      // ✅ Get email safely
      const userEmail = data?.user?.email;
      if (!userEmail) {
        console.error("⚠️ No user email found — cannot register FCM token.");
      } else {
        // lift user email up to App so components (App/Socket) can call requestForToken or join rooms
        if (typeof setCurrentUserEmail === "function") setCurrentUserEmail(userEmail);
      }

      // ✅ Request permission & FCM token
      if (Notification.permission === "granted") {
        await requestForToken(userEmail);
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          await requestForToken(userEmail);
        }
      }

      // ✅ Navigate after short delay
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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
            <span>Not registered yet? </span>
            <Link to="/register" className="register">
              Register here
            </Link>
          </div>

          <div className="forgot-password-link" style={{ textAlign: "center", marginTop: "10px" }}>
            <Link to="/resetpassword">Forgot Password?</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
