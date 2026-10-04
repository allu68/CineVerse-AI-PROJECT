const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  timeout: 12000,
  params: { api_key: TMDB_API_KEY },
});

// Axios retry helper — re-tries on ECONNRESET / 429 / 5xx up to 3 times
async function axiosWithRetry(fn, retries = 3, delay = 400) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable =
        err.code === 'ECONNRESET' ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ETIMEDOUT' ||
        err.response?.status === 429 ||
        (err.response?.status >= 500 && err.response?.status < 600);

      if (attempt < retries && isRetryable) {
        const wait = delay * attempt; // 400ms, 800ms, 1200ms
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Cached TMDB fetch — returns {} on any error, never throws.
 * This ensures routes always return graceful responses instead of 500s.
 */
async function tmdbFetch(url, params = {}, ttl = 600) {
  const cacheKey = url + JSON.stringify(params);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axiosWithRetry(() =>
      tmdb.get(url, { params })
    );
    if (data) cache.set(cacheKey, data, ttl);
    return data || {};
  } catch (err) {
    // Never propagate — always degrade gracefully
    const status = err.response?.status;
    const msg = err.response?.data?.status_message || err.message;
    console.error(`[TMDB] ${url} → ${status || err.code}: ${msg}`);
    return {};
  }
}

module.exports = { tmdb, tmdbFetch };
