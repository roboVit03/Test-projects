import React from "react";
import { jwtDecode } from "jwt-decode"; // правильный импорт для последних версий
import "../styles/styles.scss";

const Header = ({ onLogout }) => {
  const token = localStorage.getItem("token");
  let userName = "";

  if (token) {
    try {
      const decoded = jwtDecode(token); 
      userName = decoded.name || decoded.email || "";
    } catch (err) {
      console.log("Invalid token");
    }
  }

  return (
    <header
      className="header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        background: "linear-gradient(to right, #0f2c4c, #1e3c72, #2a5298)", // темный градиент
        color: "#fff",
        borderBottom: "1px solid #1a3b6b",
      }}
    >
      <div className="header-left">
        {/* Место для логотипа или заголовка */}
      </div>
      <div className="header-right">
        {token && (
          <button
            className="logout-btn"
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#00c6ff",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {userName ? `Logout (${userName})` : "Logout"}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
