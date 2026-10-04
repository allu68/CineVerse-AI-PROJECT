import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

export default function TrailerModal({ videoKey, title, onClose }) {
  return (
    <AnimatePresence>
      {videoKey && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(4,4,8,0.95)', backdropFilter: 'blur(16px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <FiX size={18} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`}
              title={title || 'Trailer'}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
