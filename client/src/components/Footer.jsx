import React from "react";

const Footer = () => {
  return (
    <footer
      style={{
        position: "fixed",      // всегда приклеен к низу экрана
        bottom: 0,
        left: 0,
        width: "100%",
        textAlign: "center",
        padding: "12px 0",
        background: "linear-gradient(to right, #0f2c4c, #1e3c72, #2a5298)",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "14px",
        borderTop: "1px solid rgba(255,255,255,0.2)",
        zIndex: 1000,
      }}
    >
      ROBOCODE & VITROBOTECHZP WEB FULL STACK 2025
    </footer>
  );
};

export default Footer;
