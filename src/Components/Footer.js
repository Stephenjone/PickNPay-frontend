import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="app-footer">
      © {new Date().getFullYear()} Catalyst — All Rights Reserved
    </footer>
  );
}
