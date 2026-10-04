import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiAlertCircle } from 'react-icons/fi';
import { searchMulti } from '../services/api';
import MovieCard from '../components/MovieCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { useDebounce } from '../hooks/useDebounce';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(1);

  // Debounce the input to avoid firing on every keystroke
  const debouncedQ = useDebounce(inputVal, 400);

  // Sync URL param → input (e.g. when Navbar search navigates here)
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== inputVal) setInputVal(urlQ);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sync debounced input → URL
  useEffect(() => {
    if (debouncedQ.trim().length >= 2) {
      setSearchParams({ q: debouncedQ.trim() }, { replace: true });
      setPage(1);
    }
  }, [debouncedQ, setSearchParams]);

  // The query we actually fire against the API
  const q = searchParams.get('q') || '';

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['search', q, page],
    // The axios interceptor in api.js already unwraps res.data,
    // so searchMulti() returns the TMDB payload directly: { results, total_results, total_pages, page }
    queryFn: () => searchMulti(q, page),
    enabled: q.trim().length >= 2,
    keepPreviousData: true,   // keeps old results visible while fetching next page
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  // TMDB /search/multi returns results with media_type field
  const movies = Array.isArray(data?.results)
    ? data.results.filter(
        (r) => r && (r.media_type === 'movie' || r.media_type === 'tv')
      )
    : [];

  const totalPages = Math.min(data?.total_pages || 1, 10);
  const totalResults = data?.total_results || 0;

  return (
    <>
      <Helmet>
        <title>{q ? `"${q}" — Search` : 'Search'} — CineVerse AI</title>
      </Helmet>

      <div className="min-h-screen pt-24 px-4 md:px-12 pb-16">

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <FiSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setPage(1);
                }}
                placeholder='Search movies, TV shows… try "RRR" or "Baahubali"'
                className="input-field pl-12 h-14 text-base w-full"
                autoFocus
              />
              {(isLoading || isFetching) && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Empty state */}
        {!q && (
          <div className="text-center py-20 text-gray-500">
            <FiSearch size={44} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-400">Search for movies, TV shows, or actors</p>
            <p className="text-sm mt-2 text-gray-600">
              Try "RRR", "Baahubali", "Pushpa", "Salaar", "Christopher Nolan"
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-20">
            <FiAlertCircle size={36} className="mx-auto mb-3 text-red-500 opacity-70" />
            <p className="text-red-400 text-lg">Failed to load search results</p>
            <p className="text-gray-500 text-sm mt-2">
              {error.message || 'Check your connection and try again.'}
            </p>
          </div>
        )}

        {/* No results */}
        {!error && q && !isLoading && movies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">
              No results for <span className="text-white font-semibold">"{q}"</span>
            </p>
            <p className="text-gray-600 text-sm mt-2">Try a different spelling or keyword.</p>
          </div>
        )}

        {/* Results */}
        {q && !error && (
          <>
            {totalResults > 0 && (
              <p className="text-gray-500 text-sm mb-6">
                {totalResults.toLocaleString()} results for{' '}
                <span className="text-white font-medium">"{q}"</span>
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {isLoading
                ? Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)
                : movies.map((movie, index) => (
                    <MovieCard
                      key={`${movie.id}-${index}`}
                      movie={movie}
                      index={index}
                    />
                  ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                        style={
                          pg === page
                            ? { background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)', color: 'white' }
                            : { background: '#13131f', color: '#9ca3af' }
                        }
                      >
                        {pg}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}