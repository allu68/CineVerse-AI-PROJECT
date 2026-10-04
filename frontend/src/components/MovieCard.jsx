import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiPlay, FiBookmark } from 'react-icons/fi';
import { img, getLangName, LANG_COLORS } from '../services/api';
import { useWatchlist } from '../hooks/useWatchlist';

const FALLBACK = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iIzBmMGYxYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMzM1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFBvc3RlcjwvdGV4dD48L3N2Zz4=';

export default function MovieCard({ movie, index = 0 }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  if (!movie) return null;

  const title = movie.title || movie.name || 'Untitled';
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const rating = movie.vote_average?.toFixed(1);
  const lang = movie.original_language;
  const langName = getLangName(lang);
  const langGrad = LANG_COLORS[lang] || 'from-gray-500 to-gray-600';
  const posterSrc = !imgErr && movie.poster_path ? img(movie.poster_path, 'w342') : FALLBACK;
  const inWatchlist = isInWatchlist(movie.id);

  const handleWatchlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(movie);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.35), ease: 'easeOut' }}
    >
      <Link to={`/movie/${movie.id}`} className="block">
        <div className="movie-card group w-[150px] sm:w-[160px] md:w-[180px]">
          {/* Poster */}
          <div className="relative aspect-[2/3] overflow-hidden bg-cinema-card">
            {/* Shimmer while loading */}
            {!imgLoaded && (
              <div className="absolute inset-0 skeleton" />
            )}

            <img
              src={posterSrc}
              alt={title}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgErr(true); setImgLoaded(true); }}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              decoding="async"
            />

            {/* Gradient overlay */}
            <div className="card-overlay" />

            {/* Watchlist button */}
            <button
              onClick={handleWatchlist}
              className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                inWatchlist
                  ? 'bg-brand-500 text-white'
                  : 'bg-black/60 text-white hover:bg-brand-500'
              }`}
              aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <FiBookmark size={12} fill={inWatchlist ? 'currentColor' : 'none'} />
            </button>

            {/* Play button on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,16,160,0.88)', backdropFilter: 'blur(4px)' }}
              >
                <FiPlay className="text-white ml-0.5" size={16} />
              </div>
            </div>

            {/* Rating badge */}
            {rating && Number(rating) > 0 && (
              <div className="absolute top-2 left-2 z-10">
                <span className="rating-badge text-xs">★ {rating}</span>
              </div>
            )}

            {/* Language badge */}
            {lang && lang !== 'en' && (
              <div className="absolute bottom-10 left-2 z-10">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r ${langGrad}`}>
                  {langName}
                </span>
              </div>
            )}

            {/* Card hover info */}
            <div className="card-info z-10">
              <p className="text-white font-semibold text-xs leading-tight line-clamp-2">{title}</p>
              {year && <p className="text-gray-400 text-xs mt-0.5">{year}</p>}
            </div>
          </div>

          {/* Below poster */}
          <div className="p-2 space-y-0.5">
            <p className="text-white text-xs font-medium leading-tight line-clamp-1">{title}</p>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">{year || '—'}</span>
              {rating && Number(rating) > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-amber-400 font-semibold">
                  <FiStar size={9} />
                  {rating}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
