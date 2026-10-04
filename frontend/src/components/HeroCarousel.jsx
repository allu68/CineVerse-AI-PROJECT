import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiInfo, FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import { backdrop, getLangName } from '../services/api';
import { HeroSkeleton } from './LoadingSkeleton';

const GENRE_MAP = {
  28:'Action',12:'Adventure',16:'Animation',35:'Comedy',80:'Crime',
  99:'Documentary',18:'Drama',10751:'Family',14:'Fantasy',36:'History',
  27:'Horror',10402:'Music',9648:'Mystery',10749:'Romance',878:'Sci-Fi',
  53:'Thriller',10752:'War',37:'Western'
};

export default function HeroCarousel({ movies = [], isLoading }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent(c => (c + 1) % movies.length);
  }, [movies.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(c => (c - 1 + movies.length) % movies.length);
  }, [movies.length]);

  useEffect(() => {
    if (movies.length < 2) return;
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next, movies.length]);

  if (isLoading) return <HeroSkeleton />;
  if (!movies.length) return null;

  const movie = movies[current];
  const genres = (movie.genre_ids || []).slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean);

  const variants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
  };

  return (
    <div className="relative w-full h-[88vh] min-h-[520px] overflow-hidden bg-cinema-darker">
      {/* Background */}
      <AnimatePresence custom={direction} mode="crossfade">
        <motion.div
          key={movie.id + '-bg'}
          custom={direction}
          variants={{ enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 1.0 }}
          className="absolute inset-0"
        >
          {movie.backdrop_path ? (
            <img
              src={backdrop(movie.backdrop_path, 'original')}
              alt={movie.title}
              className="hero-backdrop"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-900 to-cinema-darker" />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,7,17,0.97) 0%, rgba(7,7,17,0.65) 55%, rgba(7,7,17,0.2) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,7,17,1) 0%, rgba(7,7,17,0) 40%)' }} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-6 md:px-12 max-w-3xl">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={movie.id + '-content'}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-4"
          >
            {/* Language + Genres */}
            <div className="flex flex-wrap items-center gap-2">
              {movie.original_language && movie.original_language !== 'en' && (
                <span className="lang-badge">{getLangName(movie.original_language)}</span>
              )}
              {genres.map(g => (
                <span key={g} className="text-xs px-2 py-0.5 rounded-full border border-white/15 text-gray-300">{g}</span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-display font-black text-white leading-tight text-shadow-lg">
              {movie.title || movie.name}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-3 text-sm text-gray-300">
              {movie.vote_average > 0 && (
                <span className="rating-badge">
                  <FiStar size={11} />
                  {movie.vote_average?.toFixed(1)}
                </span>
              )}
              {movie.release_date && (
                <span className="text-gray-400">{movie.release_date.slice(0, 4)}</span>
              )}
            </div>

            {/* Overview */}
            {movie.overview && (
              <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 max-w-xl text-shadow">
                {movie.overview}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to={`/movie/${movie.id}`} className="btn-primary">
                <FiPlay size={16} /> Watch Now
              </Link>
              <Link to={`/movie/${movie.id}`} className="btn-secondary">
                <FiInfo size={16} /> More Info
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/15 transition-all"
      >
        <FiChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/15 transition-all"
      >
        <FiChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {movies.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? 24 : 6,
              height: 6,
              background: i === current ? '#ff10a0' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
