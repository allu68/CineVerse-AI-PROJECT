import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlay, FiStar, FiClock, FiCalendar, FiGlobe,
  FiMessageSquare, FiCpu, FiUser, FiBookmark,
  FiHeart, FiShare2, FiArrowLeft, FiExternalLink,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  getMovieDetails, getAIRecommendations, getSentimentForMovie,
  img, backdrop, avatar, getLangName,
} from '../services/api';
import { useWatchlist } from '../hooks/useWatchlist';
import { DetailSkeleton } from '../components/LoadingSkeleton';
import MovieRow from '../components/MovieRow';
import TrailerModal from '../components/TrailerModal';
import ActorModal from '../components/ActorModal';
import SentimentPanel from '../components/SentimentPanel';

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (n) =>
  n ? `$${n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : (n / 1e6).toFixed(1) + 'M'}` : null;

const RATING_COLOR = (r) => {
  const n = parseFloat(r);
  if (n >= 8) return '#4ade80';
  if (n >= 6.5) return '#facc15';
  return '#f87171';
};

const TABS = [
  { id: 'overview',  label: 'Overview',    Icon: FiGlobe },
  { id: 'cast',      label: 'Cast',        Icon: FiUser },
  { id: 'reviews',   label: 'Reviews',     Icon: FiMessageSquare },
  { id: 'sentiment', label: 'AI Sentiment',Icon: FiCpu },
];

/* ── Component ───────────────────────────────────────────────── */
export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trailerKey, setTrailerKey] = useState(null);
  const [selectedActor, setSelectedActor] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [liked, setLiked] = useState(false);
  const [posterErr, setPosterErr] = useState(false);

  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  /* Queries */
  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => getMovieDetails(id),
    enabled: !!id,
  });

  const { data: recs } = useQuery({
    queryKey: ['ai-recs', id],
    queryFn: () => getAIRecommendations(id, 14),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });

  const { data: sentiment, isLoading: sentLoading } = useQuery({
    queryKey: ['sentiment', id],
    queryFn: () => getSentimentForMovie(id),
    enabled: !!id && activeTab === 'sentiment',
    staleTime: 10 * 60 * 1000,
  });

  /* ── Loading / Error states ── */
  if (isLoading) return <DetailSkeleton />;
  if (error || !movie) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-gray-400 text-lg text-center">
        {error ? 'Failed to load movie details.' : 'Movie not found.'}
      </p>
      <button onClick={() => navigate(-1)} className="btn-secondary text-sm">
        <FiArrowLeft size={14} /> Go Back
      </button>
    </div>
  );

  /* ── Derived values ── */
  const trailer = movie.trailers?.[0];
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;
  const recMovies = recs?.results || movie.similar || [];
  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const director = movie.director;
  const inWatchlist = isInWatchlist(movie.id);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: movie.title, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const handleLike = () => {
    setLiked((p) => !p);
    toast(liked ? 'Removed from Liked' : '❤️ Added to Liked!');
  };

  /* ── Render ── */
  return (
    <>
      <Helmet>
        <title>{movie.title} {year ? `(${year})` : ''} — CineVerse AI</title>
        <meta name="description" content={movie.overview?.slice(0, 160)} />
      </Helmet>

      {/* ═══════════════════════════════════════════════════
          CINEMATIC HERO — full-screen backdrop with overlay
      ════════════════════════════════════════════════════ */}
      <div className="relative w-full" style={{ height: '70vh', minHeight: 480 }}>
        {/* Backdrop image */}
        {movie.backdrop_path ? (
          <img
            src={backdrop(movie.backdrop_path, 'original')}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.32) saturate(1.3)' }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-cinema-darker to-cinema-darker" />
        )}

        {/* Multi-layer gradients for cinematic feel */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to right, rgba(7,7,17,0.98) 0%, rgba(7,7,17,0.7) 50%, rgba(7,7,17,0.1) 100%)'
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, #070711 0%, transparent 50%)'
        }} />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-12 z-10 btn-secondary text-sm px-3 py-2"
        >
          <FiArrowLeft size={14} /> Back
        </button>

        {/* Hero content overlay */}
        <div className="absolute inset-0 flex items-end pb-12 px-4 md:px-12 z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl space-y-3"
          >
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="lang-badge">{getLangName(movie.original_language)}</span>
              {movie.genres?.slice(0, 3).map(g => (
                <span key={g.id} className="text-xs px-2.5 py-0.5 rounded-full border border-white/15 text-gray-300">
                  {g.name}
                </span>
              ))}
              {movie.adult && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-medium">
                  18+
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-display font-black text-white leading-tight text-shadow-lg">
              {movie.title}
            </h1>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-brand-400 italic text-sm opacity-90">"{movie.tagline}"</p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
              {rating && Number(rating) > 0 && (
                <span
                  className="rating-badge"
                  style={{ color: RATING_COLOR(rating), borderColor: `${RATING_COLOR(rating)}40`, background: `${RATING_COLOR(rating)}15` }}
                >
                  <FiStar size={12} /> {rating}
                  <span className="text-gray-500 text-xs ml-1">({movie.vote_count?.toLocaleString()})</span>
                </span>
              )}
              {runtime && (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <FiClock size={12} /> {runtime}
                </span>
              )}
              {year && (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <FiCalendar size={12} /> {year}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {trailer && (
                <button onClick={() => setTrailerKey(trailer.key)} className="btn-primary">
                  <FiPlay size={15} fill="currentColor" /> Watch Trailer
                </button>
              )}
              <button
                onClick={() => toggleWatchlist(movie)}
                className={`btn-secondary text-sm ${inWatchlist ? 'border-brand-500/60 text-brand-400' : ''}`}
              >
                <FiBookmark size={14} fill={inWatchlist ? 'currentColor' : 'none'} />
                {inWatchlist ? 'Saved' : 'Watchlist'}
              </button>
              <button
                onClick={handleLike}
                className={`btn-secondary text-sm ${liked ? 'border-red-500/60 text-red-400' : ''}`}
              >
                <FiHeart size={14} fill={liked ? 'currentColor' : 'none'} />
              </button>
              <button onClick={handleShare} className="btn-secondary text-sm">
                <FiShare2 size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT GRID
      ════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 -mt-2 pb-16 relative z-10">
        <div className="grid md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-8 xl:gap-12">

          {/* ── LEFT: Poster (sticky) ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden md:block"
          >
            <div className="rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/8 sticky top-24">
              <img
                src={!posterErr && movie.poster_path ? img(movie.poster_path, 'w500') : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iIzBmMGYxYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMzM1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFBvc3RlcjwvdGV4dD48L3N2Zz4='}
                alt={movie.title}
                onError={() => setPosterErr(true)}
                className="w-full aspect-[2/3] object-cover"
              />
              {/* Quick stats under poster */}
              <div className="p-4 space-y-3 bg-cinema-card border-t border-white/5">
                {director && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Director</p>
                    <button
                      onClick={() => setSelectedActor(director.id)}
                      className="text-sm text-white font-medium hover:text-brand-400 transition-colors"
                    >
                      {director.name}
                    </button>
                  </div>
                )}
                {fmt(movie.budget) && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Budget</p>
                    <p className="text-sm text-white">{fmt(movie.budget)}</p>
                  </div>
                )}
                {fmt(movie.revenue) && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Box Office</p>
                    <p className="text-sm text-green-400 font-medium">{fmt(movie.revenue)}</p>
                  </div>
                )}
                {movie.homepage && (
                  <a
                    href={movie.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <FiExternalLink size={11} /> Official website
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── RIGHT: Details ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6 min-w-0"
          >
            {/* Mobile: repeat title info */}
            <div className="md:hidden space-y-2">
              <h1 className="text-2xl font-display font-black text-white">{movie.title}</h1>
              <div className="flex flex-wrap gap-2">
                {rating && <span className="rating-badge text-xs"><FiStar size={10}/> {rating}</span>}
                {runtime && <span className="text-gray-400 text-sm">{runtime}</span>}
                {year && <span className="text-gray-400 text-sm">{year}</span>}
              </div>
              {/* Mobile action buttons */}
              <div className="flex gap-2 pt-1">
                {trailer && (
                  <button onClick={() => setTrailerKey(trailer.key)} className="btn-primary text-sm flex-1">
                    <FiPlay size={14} fill="currentColor" /> Trailer
                  </button>
                )}
                <button onClick={() => toggleWatchlist(movie)} className="btn-secondary text-sm">
                  <FiBookmark size={13} fill={inWatchlist ? 'currentColor' : 'none'} />
                </button>
                <button onClick={handleLike} className="btn-secondary text-sm">
                  <FiHeart size={13} fill={liked ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="border-b border-white/8">
              <div className="flex gap-0 overflow-x-auto no-scrollbar">
                {TABS.map(({ id: tid, label, Icon }) => (
                  <button
                    key={tid}
                    onClick={() => setActiveTab(tid)}
                    className={`relative flex items-center gap-1.5 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                      activeTab === tid ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                    {activeTab === tid && (
                      <motion.div
                        layoutId="tab-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #ff10a0, #8b5cf6)' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab Panels ── */}
            <AnimatePresence mode="wait">

              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {movie.overview && (
                    <p className="text-gray-300 leading-relaxed text-[15px]">{movie.overview}</p>
                  )}

                  {/* Keywords */}
                  {movie.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {movie.keywords.slice(0, 14).map(k => (
                        <span
                          key={k.id}
                          className="text-xs px-3 py-1 rounded-full bg-cinema-muted text-gray-400 border border-white/5 hover:border-white/15 hover:text-gray-200 transition-colors cursor-default"
                        >
                          {k.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    {[
                      { label: 'Status', value: movie.status },
                      { label: 'Language', value: getLangName(movie.original_language) },
                      { label: 'Release', value: movie.release_date },
                      ...(movie.budget > 0 ? [{ label: 'Budget', value: fmt(movie.budget) }] : []),
                      ...(movie.revenue > 0 ? [{ label: 'Revenue', value: fmt(movie.revenue), green: true }] : []),
                    ].filter(s => s.value).map(stat => (
                      <div key={stat.label} className="p-3.5 rounded-xl bg-cinema-card border border-white/5">
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-sm font-semibold ${stat.green ? 'text-green-400' : 'text-white'}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CAST */}
              {activeTab === 'cast' && (
                <motion.div
                  key="cast"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {director && (
                    <div className="flex items-center gap-3 p-3 glass rounded-xl border border-white/5">
                      <img
                        src={director.profile_path ? avatar(director.profile_path, 'w185') : `https://ui-avatars.com/api/?name=${encodeURIComponent(director.name)}&background=1e1e2e&color=fff`}
                        alt={director.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Director</p>
                        <button
                          onClick={() => setSelectedActor(director.id)}
                          className="text-white font-semibold hover:text-brand-400 transition-colors text-sm"
                        >
                          {director.name}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {movie.cast?.map((actor) => (
                      <button
                        key={actor.id}
                        onClick={() => setSelectedActor(actor.id)}
                        className="group text-center space-y-2"
                      >
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-cinema-muted">
                          <img
                            src={
                              actor.profile_path
                                ? avatar(actor.profile_path, 'w185')
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=1e1e2e&color=fff&size=128`
                            }
                            alt={actor.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-white font-medium leading-tight group-hover:text-brand-400 transition-colors line-clamp-1">{actor.name}</p>
                          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{actor.character}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* REVIEWS */}
              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {movie.reviews?.length ? (
                    movie.reviews.map(rev => (
                      <div key={rev.id} className="p-4 glass rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {rev.author?.charAt(0).toUpperCase()}
                            </div>
                            <p className="font-semibold text-sm text-white">{rev.author}</p>
                          </div>
                          {rev.author_details?.rating && (
                            <span className="rating-badge text-xs">
                              ★ {rev.author_details.rating}/10
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-5">{rev.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <FiMessageSquare size={32} className="mx-auto text-gray-600 mb-3" />
                      <p className="text-gray-500">No reviews yet.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* AI SENTIMENT */}
              {activeTab === 'sentiment' && (
                <motion.div
                  key="sentiment"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <SentimentPanel data={sentiment} isLoading={sentLoading} />
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          AI RECOMMENDATIONS
      ════════════════════════════════════════════════════ */}
      {recMovies.length > 0 && (
        <div className="border-t border-white/5 pt-8 pb-12">
          <MovieRow
            title="More Like This"
            icon="🤖"
            movies={recMovies}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════ */}
      <TrailerModal
        videoKey={trailerKey}
        title={movie.title}
        onClose={() => setTrailerKey(null)}
      />
      <ActorModal
        actorId={selectedActor}
        onClose={() => setSelectedActor(null)}
      />
    </>
  );
}
