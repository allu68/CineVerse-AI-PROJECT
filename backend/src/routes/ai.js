const router = require('express').Router();
const axios = require('axios');

const TMDB_BASE =
  process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

const TMDB_KEY = process.env.TMDB_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

/* ──────────────────────────────────────────────────────────────
   Gemini AI Call
────────────────────────────────────────────────────────────── */
async function callGemini(prompt) {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_KEY}`,
    {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],

     generationConfig: {
  maxOutputTokens: 1024,
    },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },

      timeout: 30000,
    }
  );

  const text =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return text;
}

/* ──────────────────────────────────────────────────────────────
   TMDB Search
────────────────────────────────────────────────────────────── */
async function searchTMDB(title) {
  try {
    const response = await axios.get(`${TMDB_BASE}/search/movie`, {
      params: {
        api_key: TMDB_KEY,
        query: title,
        include_adult: false,
      },

      timeout: 10000,
    });

    return response.data.results?.[0] || null;
  } catch (error) {
    console.error('[TMDB SEARCH ERROR]', title, error.message);
    return null;
  }
}

/* ──────────────────────────────────────────────────────────────
   AI Chat Route
────────────────────────────────────────────────────────────── */
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required',
      });
    }

    if (!GEMINI_KEY) {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY missing in backend environment variables',
      });
    }

    const prompt = `
You are CineVerse AI — an expert movie recommendation assistant.

User Request:
"${message}"

Rules:
- Recommend ONLY real movies
- Prefer high-rated and emotionally accurate matches
- Include Telugu, Hindi, Tamil, Malayalam, Korean, Hollywood when relevant
- Return ONLY this format

REPLY:
<short conversational reply>

MOVIES:
["Movie 1","Movie 2","Movie 3","Movie 4","Movie 5"]
`;

    const raw = await callGemini(prompt);

    console.log('\n🎬 GEMINI RESPONSE:\n', raw);

    /* ─────────────────────────────────────────────
       Parse AI Response
    ───────────────────────────────────────────── */

    const replyMatch = raw.match(
      /REPLY:\s*([\s\S]*?)(?=MOVIES:|$)/i
    );

    const moviesMatch = raw.match(
      /MOVIES:\s*(\[[\s\S]*?\])/i
    );

    const reply = replyMatch
      ? replyMatch[1].trim()
      : 'Here are some great recommendations for you!';

    let titles = [];

    if (moviesMatch) {
      try {
        titles = JSON.parse(moviesMatch[1]);
      } catch (err) {
        console.error('[MOVIE PARSE ERROR]', err.message);
      }
    }

    /* fallback quoted titles */

    if (!titles.length) {
      const quoted = raw.match(/"([^"]+)"/g);

      if (quoted) {
        titles = quoted.map((q) =>
          q.replace(/"/g, '')
        );
      }
    }

    titles = titles.slice(0, 5);

    /* ─────────────────────────────────────────────
       Fetch TMDB Data
    ───────────────────────────────────────────── */

    const movieResults = await Promise.all(
      titles.map(searchTMDB)
    );

    const movies = movieResults.filter(Boolean);

    return res.json({
      success: true,
      reply,
      titles,
      movies,
    });
  } catch (error) {
    console.error(
      '\n❌ [AI CHAT ERROR]',
      error.response?.data || error.message
    );

    return res.status(500).json({
      error:
        'AI service temporarily unavailable. Please try again.',
    });
  }
});

module.exports = router;