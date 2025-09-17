import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
    if (typeof raw[0] === "number") return raw.map(id => genreMap[id] || id).join(", ");
    if (typeof raw[0] === "string") return raw.join(", ");
    if (typeof raw[0] === "object") return raw.map(g => g.name || g.title || JSON.stringify(g)).join(", ");
  }
  if (typeof raw === "number") return genreMap[raw] || String(raw);
  if (typeof raw === "string") return raw || "N/A";
  return "N/A";
}

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5051/api/movies", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const localMovie = res.data.find(m => m.id.toString() === id);

        if (localMovie) {
          setMovie({ ...localMovie, genre: formatGenreFromMovie(localMovie) });
        } else {
        
          setMovie({ title: "Фильм не найден", description: "", year: null, genre: "N/A", posterUrl: null, commentsCount: 0 });
        }

        
        const comRes = await axios.get(`http://localhost:5051/api/comments/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setComments(comRes.data);
      } catch (err) {
        console.error("Ошибка при загрузке фильма:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, token]);

  
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setAddingComment(true);
    try {
      const res = await axios.post(
        `http://localhost:5051/api/movies/${id}/comment`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newComment = {
        id: res.data.commentId,
        comment: commentText,
        user_id: null,
        name: "Вы",
        created_at: new Date().toISOString(),
      };

      setComments(prev => [...prev, newComment]);
      setMovie(prev => ({ ...prev, commentsCount: res.data.totalComments }));
      setCommentText("");
    } catch (err) {
      console.error("Помилка додавання коментаря:", err);
    } finally {
      setAddingComment(false);
    }
  };

  if (loading) return <p style={{ color: "#fff", textAlign: "center", marginTop: "50px" }}>Загрузка фильма...</p>;
  if (!movie) return <p style={{ color: "#fff", textAlign: "center", marginTop: "50px" }}>Фильм не найден</p>;

  return (
    <div style={{ minHeight: "100vh", padding: "20px", paddingBottom: "60px", background: "linear-gradient(to bottom right, #1e3c72, #2a5298, #36d1dc)", color: "#fff", maxWidth: "600px", margin: "20px auto" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "20px", padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#00c6ff", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>
        ← Назад
      </button>

      <h2>{movie.title}</h2>
      <img src={movie.posterUrl || "https://via.placeholder.com/300x450"} alt={movie.title} style={{ width: "100%", borderRadius: "8px", marginBottom: "10px" }} />
      <p><strong>Год:</strong> {movie.year || "N/A"}</p>
      <p><strong>Жанр:</strong> {movie.genre || "N/A"}</p>
      <p>{movie.description || "Опис недоступний"}</p>

      <hr style={{ margin: "20px 0", borderColor: "rgba(255,255,255,0.3)" }} />

      <h3>Комментарии ({movie.commentsCount || 0})</h3>
      {comments.length === 0 && <p>Немає коментарів</p>}
      <ul>
        {comments.map(c => (
          <li key={c.id} style={{ marginBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "6px" }}>
            <strong>{c.name || "Користувач"}:</strong> {c.comment}
          </li>
        ))}
      </ul>

      <textarea
        value={commentText}
        onChange={e => setCommentText(e.target.value)}
        placeholder="Введіть коментар..."
        style={{ width: "100%", borderRadius: "6px", padding: "6px", resize: "none", marginTop: "10px" }}
      />
      <button
        onClick={handleAddComment}
        disabled={addingComment}
        style={{ marginTop: "6px", padding: "8px 14px", borderRadius: "6px", border: "none", backgroundColor: "#00c6ff", color: "#fff", cursor: addingComment ? "not-allowed" : "pointer" }}
      >
        {addingComment ? "Додавання..." : "Додати коментар"}
      </button>

      <Footer />
    </div>
  );
};

export default MovieDetail;
