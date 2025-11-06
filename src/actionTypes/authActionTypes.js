// src/actionTypes/authActionTypes.js

const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname.startsWith('127.');

export const REACT_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://picknpay-backend-5.onrender.com"
    : "http://localhost:5000";

