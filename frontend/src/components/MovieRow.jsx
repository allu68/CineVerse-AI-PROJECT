import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import MovieCard from './MovieCard';
import { CardSkeleton } from './LoadingSkeleton';

export default function MovieRow({ title, icon, movies = [], isLoading = false, accentColor = '#ff10a0' }) {
  const rowRef = useRef(null);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  return (
    <section className="py-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-12">
        <div className="section-title">
          {icon && <span className="text-xl">{icon}</span>}
          {title}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable Row */}
      <div
        ref={rowRef}
        className="movie-row px-4 md:px-12"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : movies.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i} />
            ))}
      </div>
    </section>
  );
}
