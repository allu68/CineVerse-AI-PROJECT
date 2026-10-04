const express = require('express');
const { tmdbFetch } = require('../services/tmdb');
const router = express.Router();

// ⚠️ CRITICAL: /search MUST be before /:id
// If /:id comes first, Express matches /search as id="search" → TMDB 404
router.get('/search', async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    const data = await tmdbFetch('/search/person', { query: q, page });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/actors/:id — full actor details + credits + images
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'Invalid actor ID' });
    }

    const [person, credits, images] = await Promise.all([
      tmdbFetch(`/person/${id}`),
      tmdbFetch(`/person/${id}/movie_credits`),
      tmdbFetch(`/person/${id}/images`),
    ]);

    const actor = {
      ...person,
      known_movies: credits.cast
        ?.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        ?.slice(0, 20) || [],
      images: images.profiles?.slice(0, 6) || [],
    };

    res.json(actor);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
