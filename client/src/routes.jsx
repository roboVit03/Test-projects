import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import Header from "./components/Header";


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const App = () => {
 
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <Router>
      <Header onLogout={handleLogout} />
      <Routes>
        {/* Логин */}
        <Route
          path="/login"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/home" />
            ) : (
              <Login onLoginSuccess={() => window.location.href = "/home"} />
            )
          }
        />

        {/* Реєстрація */}
        <Route
          path="/register"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/home" />
            ) : (
              <Register onRegisterSuccess={() => window.location.href = "/home"} />
            )
          }
        />

        {/* Головна */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Сторінка фільму */}
        <Route
          path="/movie/:id"
          element={
            <ProtectedRoute>
              <MovieDetail />
            </ProtectedRoute>
          }
        />

        {/* Редірект за замовчуванням */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
