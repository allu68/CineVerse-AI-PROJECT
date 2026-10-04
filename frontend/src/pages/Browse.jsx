import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import { getLanguageMovies, getGenreMovies, getTopRated, getNowPlaying, getUpcoming } from '../services/api';
import MovieCard from '../components/MovieCard';
import { CardSkeleton } from '../components/LoadingSkeleton';

const LANGUAGES = [
  { code: 'telugu', label: 'Telugu 🎬' },
  { code: 'hindi', label: 'Hindi 🎭' },
  { code: 'tamil', label: 'Tamil 🌟' },
  { code: 'malayalam', label: 'Malayalam 💎' },
  { code: 'kannada', label: 'Kannada 🏆' },
  { code: 'english', label: 'Hollywood 🎥' },
];

const CATEGORIES = [
  { code: 'top-rated', label: 'Top Rated ⭐' },
  { code: 'now-playing', label: 'Now Playing 🎥' },
  { code: 'upcoming', label: 'Upcoming 🚀' },
];

const GENRES = [
  { code: 'action', label: 'Action 💥' },
  { code: 'comedy', label: 'Comedy 😂' },
  { code: 'drama', label: 'Drama 🎭' },
  { code: 'thriller', label: 'Thriller 😰' },
  { code: 'romance', label: 'Romance ❤️' },
  { code: 'horror', label: 'Horror 👻' },
  { code: 'sci-fi', label: 'Sci-Fi 🚀' },
  { code: 'animation', label: 'Animation 🎨' },
];

function fetchMovies(filter, page) {
  if (LANGUAGES.find(l => l.code === filter)) return getLanguageMovies(filter, page);
  if (filter === 'top-rated') return getTopRated(page);
  if (filter === 'now-playing') return getNowPlaying(page);
  if (filter === 'upcoming') return getUpcoming(page);
  return getGenreMovies(filter, page);
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const langParam = searchParams.get('lang');
  const [filter, setFilter] = useState(langParam || 'telugu');

  useEffect(() => {
    if (langParam) setFilter(langParam);
  }, [langParam]);

  useEffect(() => { setPage(1); }, [filter]);

  const { data, isLoading } = useQuery({
    queryKey: ['browse', filter, page],
    queryFn: () => fetchMovies(filter, page),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  const movies = data?.results || [];
  const totalPages = Math.min(data?.total_pages || 1, 20);

  const allFilters = [
    { group: 'Languages', items: LANGUAGES },
    { group: 'Categories', items: CATEGORIES },
    { group: 'Genres', items: GENRES },
  ];

  const activeLabel = [...LANGUAGES, ...CATEGORIES, ...GENRES].find(f => f.code === filter)?.label || filter;

  return (
    <>
      <Helmet><title>Browse — CineVerse AI</title></Helmet>
      <div className="min-h-screen pt-20 px-4 md:px-12 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-display font-black text-white mb-1">Browse Movies</h1>
          <p className="text-gray-500 text-sm">Explore across languages, genres & categories</p>
        </motion.div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {allFilters.map(({ group, items }) => (
            <div key={group}>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FiFilter size={11} /> {group}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map(item => (
                  <button
                    key={item.code}
                    onClick={() => { setFilter(item.code); setSearchParams({}); }}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      filter === item.code
                        ? 'text-white shadow-lg'
                        : 'bg-cinema-card border border-white/8 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                    style={filter === item.code ? { background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' } : {}}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-white">
            {activeLabel}
            {data?.total_results && (
              <span className="text-gray-500 text-sm font-normal ml-2">({data.total_results.toLocaleString()} movies)</span>
            )}
          </h2>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 18 }).map((_, i) => <CardSkeleton key={i} />)
            : movies.map((m, i) => <MovieCard key={m.id} movie={m} index={i} />)
          }
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
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
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                      pg === page ? 'text-white' : 'bg-cinema-card text-gray-400 hover:text-white'
                    }`}
                    style={pg === page ? { background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' } : {}}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
