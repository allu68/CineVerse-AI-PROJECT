const express = require('express');
const { tmdbFetch } = require('../services/tmdb');
const router = express.Router();

const LANGUAGE_CODES = {
  telugu: 'te',
  hindi: 'hi',
  tamil: 'ta',
  malayalam: 'ml',
  kannada: 'kn',
  english: 'en',
  korean: 'ko',
  japanese: 'ja',
};

const GENRE_IDS = {
  action: 28, adventure: 12, animation: 16, comedy: 35,
  crime: 80, documentary: 99, drama: 18, family: 10751,
  fantasy: 14, history: 36, horror: 27, music: 10402,
  mystery: 9648, romance: 10749, 'sci-fi': 878,
  thriller: 53, war: 10752, western: 37,
};

// GET /api/discover/language/:lang
router.get('/language/:lang', async (req, res, next) => {
  try {
    const { lang } = req.params;
    const { page = 1, sort_by = 'popularity.desc', year } = req.query;
    const langCode = LANGUAGE_CODES[lang.toLowerCase()] || lang;

    const params = {
      with_original_language: langCode,
      sort_by,
      page,
      'vote_count.gte': 50,
    };
    if (year) params.primary_release_year = year;

    const data = await tmdbFetch('/discover/movie', params);
    res.json({ ...data, language: lang, lang_code: langCode });
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/genre/:genre
router.get('/genre/:genre', async (req, res, next) => {
  try {
    const { genre } = req.params;
    const { page = 1, language, sort_by = 'popularity.desc' } = req.query;
    const genreId = GENRE_IDS[genre.toLowerCase()] || genre;

    const params = { with_genres: genreId, sort_by, page, 'vote_count.gte': 50 };
    if (language) params.with_original_language = LANGUAGE_CODES[language.toLowerCase()] || language;

    const data = await tmdbFetch('/discover/movie', params);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/top-rated
router.get('/top-rated', async (req, res, next) => {
  try {
    const { page = 1, language } = req.query;
    const params = { sort_by: 'vote_average.desc', 'vote_count.gte': 200, page };
    if (language) params.with_original_language = LANGUAGE_CODES[language.toLowerCase()] || language;
    const data = await tmdbFetch('/movie/top_rated', { page, ...(language ? { region: language } : {}) });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/now-playing
router.get('/now-playing', async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/movie/now_playing', { page });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/upcoming
router.get('/upcoming', async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const data = await tmdbFetch('/movie/upcoming', { page });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/home-sections - All homepage sections in one call
router.get('/home-sections', async (req, res, next) => {
  try {
    const [
      trending, topRated, nowPlaying, upcoming,
      telugu, hindi, tamil, malayalam, kannada, action, romance
    ] = await Promise.allSettled([
      tmdbFetch('/trending/movie/week', { page: 1 }),
      tmdbFetch('/movie/top_rated', { page: 1 }),
      tmdbFetch('/movie/now_playing', { page: 1 }),
      tmdbFetch('/movie/upcoming', { page: 1 }),
      tmdbFetch('/discover/movie', { with_original_language: 'te', sort_by: 'popularity.desc', 'vote_count.gte': 30, page: 1 }),
      tmdbFetch('/discover/movie', { with_original_language: 'hi', sort_by: 'popularity.desc', 'vote_count.gte': 50, page: 1 }),
      tmdbFetch('/discover/movie', { with_original_language: 'ta', sort_by: 'popularity.desc', 'vote_count.gte': 30, page: 1 }),
      tmdbFetch('/discover/movie', { with_original_language: 'ml', sort_by: 'popularity.desc', 'vote_count.gte': 20, page: 1 }),
      tmdbFetch('/discover/movie', { with_original_language: 'kn', sort_by: 'popularity.desc', 'vote_count.gte': 20, page: 1 }),
      tmdbFetch('/discover/movie', { with_genres: 28, sort_by: 'popularity.desc', page: 1 }),
      tmdbFetch('/discover/movie', { with_genres: 10749, sort_by: 'popularity.desc', page: 1 }),
    ]);

    const extract = (result, slice = 20) =>
      result.status === 'fulfilled' ? result.value.results?.slice(0, slice) || [] : [];

    res.json({
      trending: extract(trending, 10),
      topRated: extract(topRated, 20),
      nowPlaying: extract(nowPlaying, 20),
      upcoming: extract(upcoming, 20),
      telugu: extract(telugu, 20),
      hindi: extract(hindi, 20),
      tamil: extract(tamil, 20),
      malayalam: extract(malayalam, 20),
      kannada: extract(kannada, 20),
      action: extract(action, 20),
      romance: extract(romance, 20),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/genres - List all genres
router.get('/genres', async (req, res, next) => {
  try {
    const data = await tmdbFetch('/genre/movie/list');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
