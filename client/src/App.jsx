import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import AuthPage from "./pages/AuthPage"; 
import Header from "./components/Header";

function AppWrapper() {
  const location = useLocation();
  const navigate = useNavigate();

  
  const showHeader = location.pathname !== "/";

  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    window.dispatchEvent(new Event("authChanged")); 
    navigate("/"); 
  };

  return (
    <>
      {showHeader && <Header onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
