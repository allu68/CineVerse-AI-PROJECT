import { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiUser } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { MdMovieFilter } from 'react-icons/md';
import toast from 'react-hot-toast';
import api, { img } from '../services/api';
import { Link } from 'react-router-dom';

/* ── Suggested prompts ─────────────────────────────────────────── */
const PROMPTS = [
  { icon: '🎬', text: 'Suggest emotional Telugu thrillers' },
  { icon: '❤️', text: 'Best romantic Hindi dramas 2023' },
  { icon: '🔮', text: 'Mind-bending psychological sci-fi' },
  { icon: '🌙', text: 'Korean revenge thrillers with great twists' },
  { icon: '💀', text: 'Top Tamil crime thrillers' },
  { icon: '👨‍👩‍👧', text: 'Feel-good family movies 8+ rating' },
];

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi, cinephile! 👋 I'm **CineVerse AI** — your personal cinema intelligence.\n\nTry asking:\n• *\"Suggest emotional Telugu thrillers\"*\n• *\"Best Korean revenge movies\"*\n• *\"Top-rated Hindi romantic dramas\"*",
  movies: [],
};

/* ── Typing dots ───────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-2 h-2 rounded-full"
          style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' }}
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.18 }} />
      ))}
    </div>
  );
}

/* ── Simple movie card for chat panel ─────────────────────────── */
function ChatMovieCard({ movie, index }) {
  const title  = movie.title || movie.name || 'Untitled';
  const year   = (movie.release_date || '').slice(0, 4);
  const rating = movie.vote_average?.toFixed(1);
  const poster = movie.poster_path ? img(movie.poster_path, 'w342') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      <Link to={`/movie/${movie.id}`}
        className="group flex flex-col rounded-2xl overflow-hidden border border-white/6 hover:border-pink-500/40 transition-all duration-300"
        style={{ background: '#0f0f1a' }}>
        <div className="relative aspect-[2/3] overflow-hidden bg-cinema-card">
          {poster
            ? <img src={poster} alt={title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center text-gray-700"><MdMovieFilter size={32} /></div>
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,7,17,0.85) 0%, transparent 60%)' }} />
          {rating && Number(rating) > 0 && (
            <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(245,197,24,0.15)', color: '#f5c518', border: '1px solid rgba(245,197,24,0.3)' }}>
              ★ {rating}
            </span>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-white text-xs font-semibold leading-tight line-clamp-2 group-hover:text-pink-400 transition-colors">{title}</p>
          {year && <p className="text-gray-600 text-[10px] mt-0.5">{year}</p>}
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Message bubble ────────────────────────────────────────────── */
function MessageBubble({ msg }) {
  const isBot = msg.role === 'assistant';

  // Render bold markdown-like syntax
  const renderContent = (text) => {
    return text.split('\n').map((line, li) => {
      const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
      return (
        <p key={li} className={li > 0 ? 'mt-1' : ''}>
          {parts.map((part, pi) =>
            part.startsWith('**') ? <strong key={pi} className="text-white font-semibold">{part.slice(2, -2)}</strong>
            : part.startsWith('*')  ? <em key={pi} className="text-brand-400 not-italic">{part.slice(1, -1)}</em>
            : part.startsWith('•')  ? <span key={pi} className="text-gray-400">{part}</span>
            : <span key={pi}>{part}</span>
          )}
        </p>
      );
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
        isBot ? '' : 'bg-white/10'}`}
        style={isBot ? { background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' } : {}}>
        {isBot ? <HiSparkles size={15} className="text-white" /> : <FiUser size={14} className="text-gray-300" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isBot ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
        style={isBot
          ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: '#c8c8d8' }
          : { background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)', color: '#fff' }
        }>
        {renderContent(msg.content)}
      </div>
    </motion.div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */
export default function AiChat() {
  const [messages,  setMessages]  = useState([WELCOME]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [movies,    setMovies]    = useState([]);
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: msg, movies: [] }]);
    setLoading(true);
    try {
      const { reply, movies: recs } = await api.post('/ai/chat', { message: msg });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply, movies: recs || [] }]);
      if (recs?.length) setMovies(recs);
    } catch (err) {
      const errMsg = err.message?.includes('503') || err.message?.includes('not configured')
        ? '⚙️ AI service needs a **Gemini API key**. Add `GEMINI_API_KEY` to your backend `.env` file, then restart the server.'
        : '😔 AI service is temporarily unavailable. Please try again in a moment.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: errMsg, movies: [], isError: true }]);
      toast.error('AI service unavailable');
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      <Helmet>
        <title>AI Chat — CineVerse AI</title>
        <meta name="description" content="Ask CineVerse AI for personalized movie recommendations in natural language" />
      </Helmet>

      <div className="min-h-screen pt-16 flex flex-col" style={{ background: '#070711' }}>

        {/* ── Header ── */}
        <div className="px-4 md:px-12 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)', boxShadow: '0 0 24px rgba(255,16,160,0.35)' }}>
                <HiSparkles className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-display font-black text-white">AI Cinema Assistant</h1>
                <p className="text-gray-500 text-xs mt-0.5">Powered by Google Gemini · Ask in any language</p>
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="flex flex-wrap gap-2">
              {PROMPTS.map((p, i) => (
                <motion.button key={i}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => send(p.text)} disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-gray-300 hover:text-white transition-all disabled:opacity-50 hover:border-white/20"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>{p.icon}</span> {p.text}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Body: Chat + Movies ── */}
        <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 md:px-12 py-6 gap-6 min-h-0">

          {/* Chat Panel */}
          <div className="flex flex-col flex-shrink-0 w-full lg:w-[420px] xl:w-[460px]"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 340px)', minHeight: 300 }}>
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' }}>
                    <HiSparkles size={14} className="text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input box */}
            <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask for movie recommendations…"
                  rows={2}
                  disabled={loading}
                  className="flex-1 resize-none text-sm outline-none transition-all px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e8e8f0',
                    lineHeight: '1.5',
                  }}
                  onFocus={e  => { e.target.style.borderColor = 'rgba(255,16,160,0.5)'; }}
                  onBlur={e   => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
                <motion.button onClick={() => send()} disabled={loading || !input.trim()}
                  whileTap={{ scale: 0.92 }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)', boxShadow: '0 4px 16px rgba(255,16,160,0.3)' }}>
                  <FiSend size={16} className="text-white" />
                </motion.button>
              </div>
              <p className="text-[10px] text-gray-700 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </div>

          {/* Movie Results Panel */}
          <div className="flex-1 hidden lg:flex flex-col min-w-0">
            <AnimatePresence mode="wait">
              {movies.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-16">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,16,160,0.07)', border: '2px dashed rgba(255,16,160,0.2)' }}>
                    <MdMovieFilter size={36} className="text-brand-500 opacity-40" />
                  </div>
                  <div>
                    <p className="text-gray-400 font-semibold">Movie recommendations appear here</p>
                    <p className="text-gray-600 text-sm mt-1">Ask for suggestions on the left →</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="movies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-sm text-gray-500 mb-4 font-medium">
                    🎬 {movies.length} recommendation{movies.length !== 1 ? 's' : ''} found
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {movies.map((m, i) => <ChatMovieCard key={m.id || i} movie={m} index={i} />)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: movie results below chat */}
        <AnimatePresence>
          {movies.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="lg:hidden px-4 pb-8">
              <p className="text-sm text-gray-500 mb-3 font-medium">🎬 {movies.length} recommendations</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {movies.map((m, i) => <ChatMovieCard key={m.id || i} movie={m} index={i} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
