import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiMenu, FiFilm, FiBookmark, FiLogOut, FiUser, FiLogIn } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { useQuery } from '@tanstack/react-query';
import { getSearchSuggestions, img } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useWatchlist } from '../hooks/useWatchlist';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home',   to: '/' },
  { label: 'Browse', to: '/browse' },
  { label: 'Telugu', to: '/browse?lang=telugu' },
  { label: 'Hindi',  to: '/browse?lang=hindi' },
  { label: 'Tamil',  to: '/browse?lang=tamil' },
];

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [query,       setQuery]       = useState('');
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const inputRef      = useRef(null);
  const profileRef    = useRef(null);
  const navigate      = useNavigate();
  const location      = useLocation();
  const debouncedQuery = useDebounce(query, 300);
  const { count: watchlistCount } = useWatchlist();
  const { user, authLoading, openLogin, logout } = useAuth();

  const { data: suggestions } = useQuery({
    queryKey: ['suggestions', debouncedQuery],
    queryFn:  () => getSearchSuggestions(debouncedQuery),
    enabled:  debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    setSearchOpen(false); setQuery(''); setMenuOpen(false); setProfileOpen(false);
  }, [location.pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setSearchOpen(false); setQuery(''); }
  };

  const handleSuggestionClick = (s) => {
    navigate(`/movie/${s.id}`); setSearchOpen(false); setQuery('');
  };

  /* ── User avatar initials ── */
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      {/* ── Logo ── */}
      <Link to="/" className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' }}>
          <FiFilm className="text-white text-lg" />
        </div>
        <span className="font-display font-bold text-lg hidden sm:block">
          <span className="gradient-text">CineVerse</span>
          <span className="text-white"> AI</span>
        </span>
      </Link>

      {/* ── Desktop Nav ── */}
      <div className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map(link => (
          <Link key={link.to} to={link.to}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              location.pathname === link.to
                ? 'text-white bg-white/10'
                : 'text-gray-400 hover:text-white hover:bg-white/8'
            }`}>
            {link.label}
          </Link>
        ))}
        {/* AI Chat — special pill */}
        <Link to="/ai-chat"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ml-1"
          style={location.pathname === '/ai-chat'
            ? { background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)', color: '#fff' }
            : { color: '#c084fc', border: '1px solid rgba(192,132,252,0.25)', background: 'rgba(192,132,252,0.08)' }}>
          <HiSparkles size={13} />
          AI Chat
        </Link>
      </div>

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.div key="search-open"
                initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                className="overflow-hidden">
                <form onSubmit={handleSearch} className="relative">
                  <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search movies, actors..." className="input-field pr-10 h-9 text-sm" />
                  <button type="button" onClick={() => { setSearchOpen(false); setQuery(''); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                    <FiX size={16} />
                  </button>
                </form>
                {/* Suggestions */}
                <AnimatePresence>
                  {suggestions?.results?.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="absolute top-full mt-2 left-0 right-0 glass rounded-xl overflow-hidden z-50 shadow-2xl border border-white/8">
                      {suggestions.results.map(s => (
                        <button key={s.id} onClick={() => handleSuggestionClick(s)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left">
                          <div className="w-8 h-12 rounded overflow-hidden flex-shrink-0 bg-cinema-muted">
                            {s.poster_path
                              ? <img src={img(s.poster_path, 'w92')} alt={s.title} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-gray-600"><FiFilm size={14} /></div>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">{s.title}</p>
                            <p className="text-xs text-gray-500">{s.year} · {s.media_type}</p>
                          </div>
                          {s.vote_average > 0 && (
                            <span className="rating-badge text-xs flex-shrink-0">★ {s.vote_average?.toFixed(1)}</span>
                          )}
                        </button>
                      ))}
                      <button onClick={handleSearch}
                        className="w-full p-3 text-sm text-brand-400 hover:bg-white/5 text-left border-t border-white/5 transition-colors">
                        See all results for "{query}" →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.button key="search-icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all"
                aria-label="Open search">
                <FiSearch size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Watchlist badge */}
        <Link to="/watchlist"
          className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all"
          aria-label={`Watchlist (${watchlistCount} items)`}>
          <FiBookmark size={18} />
          {watchlistCount > 0 && (
            <motion.span key={watchlistCount} initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-0.5"
              style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' }}>
              {watchlistCount > 99 ? '99+' : watchlistCount}
            </motion.span>
          )}
        </Link>

        {/* ── Auth Section ── */}
        {!authLoading && (
          user ? (
            /* User avatar + dropdown */
            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(p => !p)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' }}
                aria-label="User menu">
                {user.photoURL
                  ? <img src={user.photoURL} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  : initials}
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.14 }}
                    className="absolute right-0 top-full mt-2 w-52 glass-dark rounded-xl overflow-hidden shadow-2xl z-50 border border-white/8">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-semibold text-white truncate">{user.displayName || 'Cinephile'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/watchlist" className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <FiBookmark size={14} /> My Watchlist
                      {watchlistCount > 0 && <span className="ml-auto text-xs text-brand-400 font-semibold">{watchlistCount}</span>}
                    </Link>
                    <Link to="/ai-chat" className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <HiSparkles size={14} /> AI Chat
                    </Link>
                    <button onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors border-t border-white/5">
                      <FiLogOut size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Sign In button */
            <button onClick={openLogin}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,16,160,0.12)', color: '#ff10a0', border: '1px solid rgba(255,16,160,0.25)' }}>
              <FiLogIn size={14} /> Sign In
            </button>
          )
        )}

        {/* Mobile menu toggle */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all"
          aria-label="Toggle menu">
          {menuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
        </button>
      </div>

      {/* ── Mobile Dropdown ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
            className="absolute top-16 left-0 right-0 glass-dark border-b border-white/5 p-4 flex flex-col gap-1 md:hidden z-40">
            {NAV_LINKS.map(link => (
              <Link key={link.to} to={link.to}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/8 transition-all">
                {link.label}
              </Link>
            ))}
            <Link to="/ai-chat"
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-purple-400 hover:text-white hover:bg-white/8 transition-all flex items-center gap-2">
              <HiSparkles size={14} /> AI Chat
            </Link>
            <Link to="/watchlist"
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/8 transition-all flex items-center gap-2">
              <FiBookmark size={14} /> Watchlist
              {watchlistCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' }}>{watchlistCount}</span>
              )}
            </Link>
            {!user && (
              <button onClick={() => { openLogin(); setMenuOpen(false); }}
                className="mt-1 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' }}>
                <FiLogIn size={14} /> Sign In to CineVerse
              </button>
            )}
            {user && (
              <button onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-white/5 transition-all">
                <FiLogOut size={14} /> Sign Out ({user.displayName || user.email?.split('@')[0]})
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
