import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBookmark, FiTrash2, FiFilm } from 'react-icons/fi';
import { useWatchlist } from '../hooks/useWatchlist';
import MovieCard from '../components/MovieCard';

export default function Watchlist() {
  const { watchlist, removeFromWatchlist, clearWatchlist, count } = useWatchlist();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <>
      <Helmet>
        <title>My Watchlist — CineVerse AI</title>
      </Helmet>

      <div className="min-h-screen pt-24 px-4 md:px-12 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-display font-black text-white flex items-center gap-3">
              <FiBookmark className="text-brand-400" size={28} />
              My Watchlist
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {count === 0 ? 'Nothing saved yet' : `${count} movie${count !== 1 ? 's' : ''} saved`}
            </p>
          </div>

          {count > 0 && (
            <div className="flex gap-2">
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="btn-secondary text-sm text-red-400 border-red-500/20 hover:border-red-500/40"
                >
                  <FiTrash2 size={13} /> Clear All
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Are you sure?</span>
                  <button
                    onClick={() => { clearWatchlist(); setConfirmClear(false); }}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
                  >
                    Yes, clear
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Empty state */}
        {count === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-6 text-center"
          >
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,16,160,0.08)', border: '2px dashed rgba(255,16,160,0.2)' }}>
              <FiBookmark size={36} className="text-brand-500 opacity-50" />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-300">Your watchlist is empty</p>
              <p className="text-gray-600 text-sm mt-1">Save movies by clicking the 🔖 icon on any card</p>
            </div>
            <Link to="/browse" className="btn-primary">
              <FiFilm size={15} /> Browse Movies
            </Link>
          </motion.div>
        )}

        {/* Movie grid */}
        {count > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <AnimatePresence>
              {watchlist.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                >
                  <MovieCard movie={movie} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
