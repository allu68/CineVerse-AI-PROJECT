const express = require('express');
const { tmdbFetch } = require('../services/tmdb');
const router = express.Router();

// GET /api/search?q=&page=
router.get('/', async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const data = await tmdbFetch('/search/multi', {
      query: q.trim(),
      page,
      include_adult: false,
    });

    // Strict quality filters — no albums, remixes, junk, or posterless results
    const results = (data.results || []).filter((r) => {
      if (r.media_type !== 'movie' && r.media_type !== 'tv') return false;
      if (!r.poster_path) return false;
      if (r.media_type === 'movie' && (r.vote_count || 0) < 30) return false;
      return true;
    });

    res.json({
      ...data,
      results,
      total_results: data.total_results,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/search/movies?q= (movie-only search)
router.get('/movies', async (req, res, next) => {
  try {
    const { q, page = 1, year, language } = req.query;
    if (!q) return res.status(400).json({ error: 'Query is required' });

    const params = { query: q.trim(), page, include_adult: false };
    if (year) params.primary_release_year = year;
    if (language) params.with_original_language = language;

    const data = await tmdbFetch('/search/movie', params);

    const results = (data.results || []).filter(
      (r) => r.poster_path && (r.vote_count || 0) >= 30
    );

    res.json({ ...data, results });
  } catch (err) {
    next(err);
  }
});

// GET /api/search/suggestions?q= (autocomplete — quality filtered)
router.get('/suggestions', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ results: [] });

    const data = await tmdbFetch(
      '/search/multi',
      { query: q, page: 1, include_adult: false },
      120
    );

    const suggestions = (data.results || [])
      .filter(
        (r) =>
          (r.media_type === 'movie' || r.media_type === 'tv') &&
          r.poster_path &&
          (r.vote_count || 0) >= 20
      )
      .slice(0, 7)
      .map((r) => ({
        id: r.id,
        title: r.title || r.name,
        media_type: r.media_type,
        year: (r.release_date || r.first_air_date || '').slice(0, 4),
        poster_path: r.poster_path,
        vote_average: r.vote_average,
      }));

    res.json({ results: suggestions });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
