// src/actionTypes/authActionTypes.js

const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname.startsWith('127.');

export const REACT_API_URL = isLocalhost
  ? "http://localhost:5000"
  : "https://picknpay-backend-5.onrender.com";
