import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFilm, FiHome } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-md"
      >
        <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(255,16,160,0.15), rgba(139,92,246,0.15))', border: '2px solid rgba(255,16,160,0.3)' }}>
          <FiFilm size={36} className="text-brand-400" />
        </div>
        <div>
          <h1 className="text-8xl font-display font-black gradient-text">404</h1>
          <p className="text-2xl font-bold text-white mt-2">Scene Not Found</p>
          <p className="text-gray-500 mt-2 text-sm">This page has been cut from the final edit.</p>
        </div>
        <Link to="/" className="btn-primary inline-flex">
          <FiHome size={16} /> Back to CineVerse
        </Link>
      </motion.div>
    </div>
  );
}
