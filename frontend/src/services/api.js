import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// ── Image Helpers ──────────────────────────────────────────────────────────
export const img = (path, size = 'w500') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

export const backdrop = (path, size = 'w1280') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

export const avatar = (path, size = 'w185') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;

// ── Trending ──────────────────────────────────────────────────────────────
export const getTrendingHero = () => api.get('/trending/hero');
export const getTrendingAll  = (page = 1) => api.get(`/trending?media_type=movie&time_window=week&page=${page}`);

// ── Discover / Sections ────────────────────────────────────────────────────
export const getHomeSections = () => api.get('/discover/home-sections');
export const getLanguageMovies = (lang, page = 1) => api.get(`/discover/language/${lang}?page=${page}`);
export const getGenreMovies = (genre, page = 1) => api.get(`/discover/genre/${genre}?page=${page}`);
export const getTopRated    = (page = 1) => api.get(`/discover/top-rated?page=${page}`);
export const getNowPlaying  = (page = 1) => api.get(`/discover/now-playing?page=${page}`);
export const getUpcoming    = (page = 1) => api.get(`/discover/upcoming?page=${page}`);
export const getGenres      = () => api.get('/discover/genres');

// ── Movies ─────────────────────────────────────────────────────────────────
export const getMovieDetails        = (id) => api.get(`/movies/${id}`);
export const getMovieRecommendations = (id, page = 1) => api.get(`/movies/${id}/recommendations?page=${page}`);

// ── Search ─────────────────────────────────────────────────────────────────
export const searchMovies      = (q, page = 1) => api.get(`/search/movies?q=${encodeURIComponent(q)}&page=${page}`);
export const searchMulti       = (q, page = 1) => api.get(`/search?q=${encodeURIComponent(q)}&page=${page}`);
export const getSearchSuggestions = (q) => api.get(`/search/suggestions?q=${encodeURIComponent(q)}`);

// ── Actors ─────────────────────────────────────────────────────────────────
export const getActor = (id) => api.get(`/actors/${id}`);

// ── AI Recommendations ─────────────────────────────────────────────────────
export const getAIRecommendations = (movieId, limit = 12) =>
  api.get(`/recommendations/${movieId}?limit=${limit}`);

export const getAIRecommendationsByTitle = (title, limit = 12) =>
  api.post('/recommendations/by-title', { title, limit });

// ── Sentiment (via AI engine directly or backend proxy) ────────────────────
const AI_ENGINE = import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000';

export const getSentimentForMovie = async (movieId) => {
  try {
    const res = await axios.get(`${AI_ENGINE}/sentiment/movie/${movieId}`, { timeout: 10000 });
    return res.data;
  } catch {
    return null;
  }
};

// ── Utility ────────────────────────────────────────────────────────────────
export const LANGUAGE_NAMES = {
  te: 'Telugu', hi: 'Hindi', ta: 'Tamil',
  ml: 'Malayalam', kn: 'Kannada', en: 'English',
  ko: 'Korean', ja: 'Japanese', fr: 'French', es: 'Spanish',
};

export const getLangName = (code) => LANGUAGE_NAMES[code] || code?.toUpperCase() || 'Unknown';

export const LANG_COLORS = {
  te: 'from-amber-500 to-orange-600',
  hi: 'from-orange-500 to-red-600',
  ta: 'from-red-500 to-pink-600',
  ml: 'from-green-500 to-teal-600',
  kn: 'from-yellow-500 to-amber-600',
  en: 'from-blue-500 to-indigo-600',
  ko: 'from-purple-500 to-violet-600',
};

export default api;
