import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiMapPin, FiCalendar, FiFilm } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { getActor, avatar, img } from '../services/api';
import { Link } from 'react-router-dom';

export default function ActorModal({ actorId, onClose }) {
  const { data: actor, isLoading } = useQuery({
    queryKey: ['actor', actorId],
    queryFn: () => getActor(actorId),
    enabled: !!actorId,
  });

  return (
    <AnimatePresence>
      {actorId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(4,4,8,0.88)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="glass rounded-2xl overflow-hidden max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="p-8 flex items-center justify-center min-h-[300px]">
                <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : actor ? (
              <>
                {/* Header */}
                <div className="relative">
                  <div className="h-32 bg-gradient-to-r from-brand-900 via-purple-900 to-cinema-dark" />
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                  >
                    <FiX size={16} />
                  </button>
                  <div className="absolute bottom-0 left-6 translate-y-1/2">
                    <img
                      src={actor.profile_path ? avatar(actor.profile_path, 'w185') : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=1e1e2e&color=fff&size=100`}
                      alt={actor.name}
                      className="w-20 h-20 rounded-full border-4 border-cinema-card object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 pt-14">
                  <h2 className="text-2xl font-display font-bold text-white">{actor.name}</h2>
                  <p className="text-brand-400 text-sm font-medium mt-0.5">{actor.known_for_department}</p>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                    {actor.birthday && (
                      <span className="flex items-center gap-1.5">
                        <FiCalendar size={13} className="text-brand-400" />
                        {actor.birthday}
                        {actor.deathday && ` – ${actor.deathday}`}
                      </span>
                    )}
                    {actor.place_of_birth && (
                      <span className="flex items-center gap-1.5">
                        <FiMapPin size={13} className="text-brand-400" />
                        {actor.place_of_birth}
                      </span>
                    )}
                  </div>

                  {actor.biography && (
                    <p className="text-gray-400 text-sm leading-relaxed mt-4 line-clamp-5">
                      {actor.biography}
                    </p>
                  )}

                  {/* Known Movies */}
                  {actor.known_movies?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="section-title text-base mb-3">
                        <FiFilm size={14} /> Known For
                      </h3>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {actor.known_movies.slice(0, 12).map(m => (
                          <Link
                            key={m.id}
                            to={`/movie/${m.id}`}
                            onClick={onClose}
                            className="flex-shrink-0 w-20 group"
                          >
                            <div className="rounded-lg overflow-hidden bg-cinema-muted aspect-[2/3] mb-1">
                              {m.poster_path ? (
                                <img
                                  src={img(m.poster_path, 'w154')}
                                  alt={m.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600"><FiFilm /></div>
                              )}
                            </div>
                            <p className="text-gray-400 text-[10px] line-clamp-2 group-hover:text-white transition-colors">{m.title}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-400">Actor not found</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
