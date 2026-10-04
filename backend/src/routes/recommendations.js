const express = require('express');
const axios = require('axios');
const { tmdbFetch } = require('../services/tmdb');
const router = express.Router();

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// GET /api/recommendations/:movieId - AI-powered recommendations
router.get('/:movieId', async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { limit = 12 } = req.query;

    // Try AI engine first
    try {
      const aiRes = await axios.get(`${AI_ENGINE_URL}/recommend/${movieId}`, {
        params: { limit },
        timeout: 5000,
      });

      if (aiRes.data?.recommendations?.length > 0) {
        // Enrich AI recommendations with TMDB data
        const enriched = await Promise.allSettled(
          aiRes.data.recommendations.slice(0, Number(limit)).map(rec =>
            tmdbFetch(`/movie/${rec.movie_id}`)
              .then(d => ({ ...d, ai_score: rec.score, ai_reason: rec.reason }))
              .catch(() => null)
          )
        );
        const results = enriched
          .filter(r => r.status === 'fulfilled' && r.value)
          .map(r => r.value);
        return res.json({ source: 'ai_engine', results });
      }
    } catch (aiErr) {
      console.warn('AI engine unavailable, falling back to TMDB:', aiErr.message);
    }

    // Fallback: TMDB similar + recommendations
    const [similar, tmdbRecs] = await Promise.all([
      tmdbFetch(`/movie/${movieId}/similar`, { page: 1 }),
      tmdbFetch(`/movie/${movieId}/recommendations`, { page: 1 }),
    ]);

    const combined = [
      ...(tmdbRecs.results || []),
      ...(similar.results || []),
    ];

    // Deduplicate
    const seen = new Set();
    const results = combined.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    }).slice(0, Number(limit));

    res.json({ source: 'tmdb_fallback', results });
  } catch (err) {
    next(err);
  }
});

// POST /api/recommendations/by-title - Recommend by movie title
router.post('/by-title', async (req, res, next) => {
  try {
    const { title, limit = 12 } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    try {
      const aiRes = await axios.post(`${AI_ENGINE_URL}/recommend/by-title`, {
        title, limit,
      }, { timeout: 5000 });
      if (aiRes.data?.recommendations?.length > 0) {
        const enriched = await Promise.allSettled(
          aiRes.data.recommendations.map(rec =>
            tmdbFetch(`/movie/${rec.movie_id}`)
              .then(d => ({ ...d, ai_score: rec.score, ai_reason: rec.reason }))
              .catch(() => null)
          )
        );
        const results = enriched.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
        return res.json({ source: 'ai_engine', results });
      }
    } catch (aiErr) {
      console.warn('AI engine unavailable:', aiErr.message);
    }

    // Fallback: search and recommend
    const search = await tmdbFetch('/search/movie', { query: title, page: 1 });
    const firstResult = search.results?.[0];
    if (!firstResult) return res.json({ source: 'fallback', results: [] });

    const recs = await tmdbFetch(`/movie/${firstResult.id}/recommendations`);
    res.json({ source: 'tmdb_fallback', results: recs.results?.slice(0, Number(limit)) || [] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
