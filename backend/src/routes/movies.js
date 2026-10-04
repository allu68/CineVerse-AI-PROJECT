const express = require('express');
const { tmdbFetch } = require('../services/tmdb');
const router = express.Router();

// GET /api/movies/:id - Full movie details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [details, credits, videos, reviews, similar, keywords] = await Promise.all([
      tmdbFetch(`/movie/${id}`, { append_to_response: 'release_dates' }),
      tmdbFetch(`/movie/${id}/credits`),
      tmdbFetch(`/movie/${id}/videos`),
      tmdbFetch(`/movie/${id}/reviews`, { page: 1 }),
      tmdbFetch(`/movie/${id}/similar`, { page: 1 }),
      tmdbFetch(`/movie/${id}/keywords`),
    ]);

    // Compose comprehensive movie data
    const movie = {
      ...details,
      cast: credits.cast?.slice(0, 15) || [],
      crew: credits.crew?.filter(c => ['Director', 'Producer', 'Screenplay', 'Story'].includes(c.job))?.slice(0, 10) || [],
      director: credits.crew?.find(c => c.job === 'Director') || null,
      trailers: videos.results?.filter(v => v.type === 'Trailer' && v.site === 'YouTube')?.slice(0, 3) || [],
      reviews: reviews.results?.slice(0, 8) || [],
      similar: similar.results?.slice(0, 12) || [],
      keywords: keywords.keywords || [],
    };

    res.json(movie);
  } catch (err) {
    next(err);
  }
});

// GET /api/movies/:id/recommendations - TMDB recommendations
router.get('/:id/recommendations', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    const data = await tmdbFetch(`/movie/${id}/recommendations`, { page });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/movies/popular - Popular movies
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, language } = req.query;
    const params = { page };
    if (language) params.with_original_language = language;
    const data = await tmdbFetch('/movie/popular', params);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
