import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL; 
// 👆 Comes from your .env file in frontend

export const AuthProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");

    if (email) setUserEmail(email.trim());
    if (name) setUserName(name.trim());
  }, []);

  // ✅ Login using backend API
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();

      // Store token & user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userName", data.name);

      setUserEmail(data.email.trim());
      setUserName(data.name.trim());

      return data;
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register using backend API
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) throw new Error("Registration failed");

      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Register error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout clears everything
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setUserEmail("");
    setUserName("");
  };

  return (
    <AuthContext.Provider
      value={{ userEmail, userName, login, register, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
