const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const morgan = require("morgan");
require("dotenv").config();

const { logEvent, logError } = require("./logger"); 

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));


// Підключення до БД

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


// Middleware авторизації

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    req.user = payload;
    next();
  } catch (err) {
    logError(err, "АВТОРИЗАЦІЯ");
    return res.status(401).json({ message: "Invalid token" });
  }
}


// Централізований обробник помилок

function errorHandler(err, req, res, next) {
  logError(err, "СЕРВЕР");
  console.error("❌ Error:", err && err.message ? err.message : err);
  res.status(500).json({
    message: "Server error",
    error: err && err.message ? err.message : String(err),
  });
}


// Логування викликів API

app.use((req, res, next) => {
  logEvent(`Виклик API: ${req.method} ${req.originalUrl}`, "API");
  next();
});


// Auth

app.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email, password required" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        logError(err, "БАЗА ДАНИХ");
        return next(err);
      }
      const token = jwt.sign(
        { id: result.insertId, name, email },
        process.env.JWT_SECRET || "secret_key",
        { expiresIn: "1h" }
      );
      logEvent(`Новий користувач зареєстрований: ${email}`, "АВТОРИЗАЦІЯ");
      res.json({ message: "User registered successfully!", token });
    });
  } catch (err) {
    logError(err, "АВТОРИЗАЦІЯ");
    next(err);
  }
});

app.post("/login", (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
      if (err) {
        logError(err, "БАЗА ДАНИХ");
        return next(err);
      }
      if (results.length === 0) return res.status(401).send("User not found");

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).send("Wrong password");

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        process.env.JWT_SECRET || "secret_key",
        { expiresIn: "1h" }
      );
      logEvent(`Користувач увійшов: ${email}`, "АВТОРИЗАЦІЯ");
      res.json({ token });
    });
  } catch (err) {
    logError(err, "АВТОРИЗАЦІЯ");
    next(err);
  }
});


// Movies

app.get("/api/movies", authMiddleware, (req, res, next) => {
  const userId = req.user.id;

  const sql = `
    SELECT m.*, 
      IFNULL(SUM(r.type='like'),0) AS likes,
      IFNULL(SUM(r.type='dislike'),0) AS dislikes,
      MAX(CASE WHEN r.user_id=? THEN r.type END) AS myReaction,
      COUNT(c.id) AS commentsCount
    FROM movies m
    LEFT JOIN reactions r ON r.movie_id = m.id
    LEFT JOIN comments c ON c.movie_id = m.id
    GROUP BY m.id
    ORDER BY m.id DESC
  `;
  db.query(sql, [userId], (err, result) => {
    if (err) {
      logError(err, "БАЗА ДАНИХ");
      return next(err);
    }
    res.json(result);
  });
});


// Sync Movies from TMDB

app.get("/api/sync-movies", async (req, res, next) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_KEY}&language=en-US&page=1`
    );
    const movies = response.data.results;
    const newMovies = [];

    const promises = movies.map((movie) => {
      return new Promise((resolve, reject) => {
        const year = movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : null;
        const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
        const description = movie.overview || "";
        const genres = movie.genre_ids && movie.genre_ids.length > 0 ? movie.genre_ids.join(",") : null;

        const sql = `
          INSERT INTO movies (tmdb_id, title, year, genre, posterUrl, description)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            year = VALUES(year),
            genre = VALUES(genre),
            posterUrl = VALUES(posterUrl),
            description = VALUES(description)
        `;
        db.query(sql, [movie.id, movie.title, year, genres, posterUrl, description], (err, result) => {
          if (err) {
            logError(err, "БАЗА ДАНИХ");
            return reject(err);
          } 
          if (result.affectedRows > 0) newMovies.push(movie);
          resolve(result);
        });
      });
    });

    await Promise.all(promises);
    logEvent(`Синхронізація фільмів завершена. Нові фільми: ${newMovies.length}`, "API");
    res.json({ message: "Movies synced successfully!", movies: newMovies });
  } catch (err) {
    logError(err, "API");
    next(err);
  }
});


// Reactions

app.post("/api/movies/:id/reaction", authMiddleware, (req, res, next) => {
  const userId = req.user.id;
  const movieId = Number(req.params.id);
  const type = req.body.type;

  if (!["like","dislike"].includes(type)) return res.status(400).json({ message: "Invalid type" });

  const sql = `
    INSERT INTO reactions (user_id, movie_id, type)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE type = VALUES(type)
  `;
  db.query(sql, [userId, movieId, type], (err) => {
    if (err) {
      logError(err, "БАЗА ДАНИХ");
      return next(err);
    }

    const statsSql = `
      SELECT
        IFNULL(SUM(type='like'),0) AS likes,
        IFNULL(SUM(type='dislike'),0) AS dislikes,
        MAX(CASE WHEN user_id=? THEN type END) AS myReaction
      FROM reactions
      WHERE movie_id=?
    `;
    db.query(statsSql, [userId, movieId], (err2, result) => {
      if (err2) {
        logError(err2, "БАЗА ДАНИХ");
        return next(err2);
      }
      res.json(result[0] || { likes:0, dislikes:0, myReaction:null });
    });
  });
});


// Comments

app.post("/api/movies/:id/comment", authMiddleware, (req, res, next) => {
  const userId = req.user.id;
  const movieId = Number(req.params.id);
  const text = req.body.text;

  if (!text || !text.trim()) return res.status(400).json({ message: "text required" });

  const sql = "INSERT INTO comments (user_id, movie_id, comment) VALUES (?, ?, ?)";
  db.query(sql, [userId, movieId, text], (err, result) => {
    if (err) {
      logError(err, "БАЗА ДАНИХ");
      return next(err);
    }

    const cntSql = "SELECT COUNT(*) AS cnt FROM comments WHERE movie_id=?";
    db.query(cntSql, [movieId], (err2, rows) => {
      if (err2) {
        logError(err2, "БАЗА ДАНИХ");
        return next(err2);
      }
      logEvent(`Додано коментар від користувача ${userId} для фільму ${movieId}`, "КОМЕНТАРІ");
      res.json({ commentId: result.insertId, totalComments: rows[0].cnt });
    });
  });
});

app.get("/api/comments/:movieId", authMiddleware, (req, res, next) => {
  const movieId = Number(req.params.movieId);
  const sql = `
    SELECT c.id, c.comment, c.user_id, u.name, c.created_at
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.movie_id = ?
    ORDER BY c.created_at ASC
  `;
  db.query(sql, [movieId], (err, rows) => {
    if (err) {
      logError(err, "БАЗА ДАНИХ");
      return next(err);
    }
    res.json(rows);
  });
});


// Error handler

app.use(errorHandler);


// Запуск сервера

const PORT = process.env.PORT || 5051;
app.listen(PORT, () => {
  logEvent(`Сервер запущено на порті ${PORT}`, "INFO");
  console.log(`Server running on port ${PORT}`);
});
