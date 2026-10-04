const express = require('express');
const { tmdbFetch } = require('../services/tmdb');
const router = express.Router();

// GET /api/trending?media_type=movie&time_window=week
router.get('/', async (req, res, next) => {
  try {
    const { media_type = 'movie', time_window = 'week', page = 1 } = req.query;
    const data = await tmdbFetch(`/trending/${media_type}/${time_window}`, { page });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/trending/all - Trending movies + TV
router.get('/all', async (req, res, next) => {
  try {
    const [movies, tv] = await Promise.all([
      tmdbFetch('/trending/movie/week', { page: 1 }),
      tmdbFetch('/trending/tv/week', { page: 1 }),
    ]);
    res.json({
      movies: movies.results?.slice(0, 10) || [],
      tv: tv.results?.slice(0, 10) || [],
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/trending/hero - Hero carousel items (top 5 trending with backdrops)
router.get('/hero', async (req, res, next) => {
  try {
    const data = await tmdbFetch('/trending/movie/week', { page: 1 });
    const hero = data.results
      ?.filter(m => m.backdrop_path)
      ?.slice(0, 6)
      ?.map(m => ({
        id: m.id,
        title: m.title || m.name,
        overview: m.overview,
        backdrop_path: m.backdrop_path,
        poster_path: m.poster_path,
        vote_average: m.vote_average,
        release_date: m.release_date,
        genre_ids: m.genre_ids,
        media_type: m.media_type || 'movie',
      })) || [];
    res.json({ results: hero });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
