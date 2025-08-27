import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");

    if (email) setUserEmail(email.trim());
    if (name) setUserName(name.trim());
  }, []);

  const login = (email, name) => {
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", name);
    setUserEmail(email.trim());
    setUserName(name.trim());
  };

  const logout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setUserEmail("");
    setUserName("");
  };

  return (
    <AuthContext.Provider value={{ userEmail, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
