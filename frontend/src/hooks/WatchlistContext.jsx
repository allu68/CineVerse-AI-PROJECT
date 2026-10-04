import { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/* ── localStorage helpers ──────────────────────────────────────── */
const STORAGE_KEY = 'cineverse_watchlist';

function readStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function writeStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { /* private mode or quota exceeded */ }
}

/* ── Context ───────────────────────────────────────────────────── */
export const WatchlistContext = createContext(null);

/* ── Provider — JSX lives here (file MUST be .jsx) ─────────────── */
export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() => readStorage());

  const isInWatchlist = useCallback(
    (id) => watchlist.some((m) => m.id === id),
    [watchlist]
  );

  const addToWatchlist = useCallback((movie) => {
    setWatchlist((prev) => {
      if (prev.some((m) => m.id === movie.id)) return prev;
      const entry = {
        id: movie.id,
        title: movie.title || movie.name || 'Untitled',
        poster_path: movie.poster_path || null,
        vote_average: movie.vote_average || 0,
        release_date: movie.release_date || movie.first_air_date || '',
        original_language: movie.original_language || '',
        overview: movie.overview || '',
        media_type: movie.media_type || 'movie',
        addedAt: Date.now(),
      };
      const next = [entry, ...prev];
      writeStorage(next);
      return next;
    });
    toast.success('Added to Watchlist', { icon: '🔖' });
  }, []);

  const removeFromWatchlist = useCallback((movieId) => {
    setWatchlist((prev) => {
      const next = prev.filter((m) => m.id !== movieId);
      writeStorage(next);
      return next;
    });
    toast('Removed from Watchlist', { icon: '🗑️' });
  }, []);

  const toggleWatchlist = useCallback(
    (movie) => {
      const saved = watchlist.some((m) => m.id === movie.id);
      if (saved) removeFromWatchlist(movie.id);
      else addToWatchlist(movie);
    },
    [watchlist, addToWatchlist, removeFromWatchlist]
  );

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
    writeStorage([]);
    toast('Watchlist cleared', { icon: '🗑️' });
  }, []);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isInWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        clearWatchlist,
        count: watchlist.length,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

/* ── Hook ──────────────────────────────────────────────────────── */
export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error(
      'useWatchlist must be used inside <WatchlistProvider>. ' +
      'Wrap your app in <WatchlistProvider> in main.jsx.'
    );
  }
  return ctx;
}
