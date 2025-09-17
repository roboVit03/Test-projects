import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const genreMap = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

function formatGenreFromMovie(movie) {
  const raw = movie.genre ?? movie.genre_ids ?? movie.genres ?? null;
  if (!raw) return "N/A";

  if (Array.isArray(raw)) {
    if (raw.length === 0) return "N/A";
    if (typeof raw[0] === "number") return raw.map((id) => genreMap[id] || id).join(", ");
    if (typeof raw[0] === "string") return raw.join(", ");
    if (typeof raw[0] === "object") return raw.map((g) => g.name || g.title || JSON.stringify(g)).join(", ");
  }

  if (typeof raw === "number") return genreMap[raw] || String(raw);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((item) => (typeof item === "number" ? genreMap[item] || item : item.name || item)).join(", ");
    } catch {}
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    const allNums = parts.length > 0 && parts.every((p) => /^\d+$/.test(p));
    if (allNums) return parts.map((p) => genreMap[Number(p)] || p).join(", ");
    return raw || "N/A";
  }

  return "N/A";
}

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [openCommentId, setOpenCommentId] = useState(null); 
  const [commentText, setCommentText] = useState("");
  const navigate = useNavigate();

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5051/api/movies", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const normalized = res.data.map((m) => ({
        ...m,
        genre: formatGenreFromMovie(m),
        likes: m.likes || 0,
        dislikes: m.dislikes || 0,
        myReaction: m.myReaction || null,
        commentsCount: m.commentsCount || 0,
      }));

      setMovies(normalized);
    } catch (err) {
      console.error("Error loading movies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (movieId, type) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await axios.post(
        `http://localhost:5051/api/movies/${movieId}/reaction`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { likes, dislikes, myReaction } = res.data;

      setMovies((prev) =>
        prev.map((m) =>
          m.id === Number(movieId)
            ? { ...m, likes, dislikes, myReaction }
            : m
        )
      );
    } catch (err) {
      console.error("Reaction error:", err);
    }
  };

  const handleCommentClick = (movieId) => {
    setOpenCommentId(openCommentId === movieId ? null : movieId);
    setCommentText("");
  };

  const handleAddComment = async (movieId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      if (!commentText.trim()) return;

      const res = await axios.post(
        `http://localhost:5051/api/movies/${movieId}/comment`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMovies((prev) =>
        prev.map((m) =>
          m.id === movieId
            ? { ...m, commentsCount: res.data.totalComments }
            : m
        )
      );

      setOpenCommentId(null);
      setCommentText("");
    } catch (err) {
      console.error("Add comment error:", err);
    }
  };

  const shuffleMovies = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const syncMovies = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem("token");
      await axios.get("http://localhost:5051/api/sync-movies", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await fetchMovies();
      setMovies((prev) => shuffleMovies(prev));
    } catch (err) {
      console.error("Error syncing movies:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    else fetchMovies();
  }, [navigate]);

  if (loading)
    return (
      <p style={{ color: "#fff", textAlign: "center", marginTop: "50px" }}>
        Loading movies...
      </p>
    );

  return (
    <div style={{ minHeight: "100vh", padding: "20px", paddingBottom: "60px", background: "linear-gradient(to bottom right, #1e3c72, #2a5298, #36d1dc)", color: "#fff", fontFamily: "Arial, sans-serif" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={syncMovies}
          disabled={syncing}
          style={{
            padding: "12px 28px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#00c6ff",
            color: "#fff",
            cursor: syncing ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            outline: "none",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            transition: "background-color 0.2s ease",
          }}
        >
          {syncing ? "Refreshing..." : "Refresh Films"}
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
        {movies.map((movie) => (
          <div key={movie.id} style={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", padding: "10px", width: "200px", backgroundColor: "rgba(0,0,0,0.4)" }}>
            <Link to={`/movie/${movie.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <img src={movie.posterUrl || "https://via.placeholder.com/200x300"} alt={movie.title} style={{ width: "100%", borderRadius: "8px", marginBottom: "10px" }} />
            </Link>

            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "10px" }}>
              <button onClick={() => handleReaction(movie.id, "like")} style={{ background: "none", border: "none", color: movie.myReaction === "like" ? "#00ff99" : "#fff", cursor: "pointer", fontSize: "18px" }}>👍 {movie.likes}</button>
              <button onClick={() => handleCommentClick(movie.id)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "18px" }}>💬 {movie.commentsCount}</button>
              <button onClick={() => handleReaction(movie.id, "dislike")} style={{ background: "none", border: "none", color: movie.myReaction === "dislike" ? "#ff4444" : "#fff", cursor: "pointer", fontSize: "18px" }}>👎 {movie.dislikes}</button>
            </div>

            {openCommentId === movie.id && (
              <div style={{ marginBottom: "10px" }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter your comment..."
                  style={{ width: "100%", borderRadius: "6px", padding: "6px", resize: "none" }}
                />
                <button
                  onClick={() => handleAddComment(movie.id)}
                  style={{ marginTop: "4px", padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: "#00c6ff", color: "#fff", cursor: "pointer" }}
                >
                  Add Comment
                </button>
              </div>
            )}

            <h3>{movie.title}</h3>
            <p><strong>Year:</strong> {movie.year}</p>
            <p><strong>Genre:</strong> {movie.genre}</p>
            <p>{movie.description}</p>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default Home;
