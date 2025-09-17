
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/api";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      let data;
      if (mode === "login") {
        data = await login(email, password);
      } else {
        data = await register(name, email, password);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name || "");
      window.dispatchEvent(new Event("authChanged"));
      navigate("/home");
    } catch (err) {
      setError(mode === "login" ? "Невірний логін або пароль" : "Помилка реєстрації");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.formWrapper}>
        <h1 style={styles.title}>{mode === "login" ? "Login" : "Register"}</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "register" && (
            <input
              type="text"
              placeholder="Ім'я"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? (mode === "login" ? "Вхід..." : "Реєструємо...") : (mode === "login" ? "Вхід" : "Зареєструватися")}
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.toggleText} onClick={toggleMode}>
          {mode === "login" ? "Немає акаунту? Зареєструватися" : "Вже є акаунт? Вхід"}
        </p>
      </div>
    </div>
  );
}


const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to bottom right, #1e3c72, #2a5298, #36d1dc)", 
  },
  formWrapper: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: "40px",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
  },
  title: {
    textAlign: "center",
    color: "#fff",
    marginBottom: "20px",
    fontSize: "2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#00c6ff",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "1rem",
    transition: "all 0.3s ease",
  },
  error: {
    color: "#ff6b6b",
    marginTop: "10px",
    textAlign: "center",
  },
  toggleText: {
    marginTop: "15px",
    textAlign: "center",
    cursor: "pointer",
    color: "#fff",
    textDecoration: "underline",
  },
};
