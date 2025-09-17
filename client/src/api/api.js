import axios from "axios";

// TMDb API ключ
const TMDB_API_KEY = "YOUR_TMDB_API_KEY"; // замените на свой ключ
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Серверная часть для логина/регистрации
const SERVER_URL = "http://localhost:5051"; // ваш backend

// Axios для сервера
const serverApi = axios.create({
  baseURL: SERVER_URL,
});

serverApi.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Axios для TMDb
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
});

// === API функции ===

// Сервер
export const login = async (email, password) => {
  try {
    const res = await serverApi.post("/login", { email, password });
    return res.data;
  } catch (err) {
    console.log("Ошибка при логине:", err.response?.data || err.message || err);
    throw err.response?.data || err;
  }
};

export const register = async (name, email, password) => {
  try {
    // ⚠️ Если сервер ожидает другое имя ключа, поменяй name -> username
    const res = await serverApi.post("/register", { name, email, password });
    return res.data;
  } catch (err) {
    console.log("Ошибка при регистрации:", err.response?.data || err.message || err);
    throw err.response?.data || err;
  }
};

// TMDb
export const getMovies = async () => {
  const res = await tmdbApi.get(`/movie/popular?api_key=${TMDB_API_KEY}&language=ru-RU&page=1`);
  return res.data.results; // массив фильмов
};

export const getMovieById = async (id) => {
  const res = await tmdbApi.get(`/movie/${id}?api_key=${TMDB_API_KEY}&language=ru-RU`);
  return res.data;
};

export default serverApi;
