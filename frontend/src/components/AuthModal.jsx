import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { HiSparkles } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';

const BACKDROP = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};
const PANEL = {
  hidden:  { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { type: 'spring', damping: 22, stiffness: 280 } },
  exit:    { opacity: 0, scale: 0.94, y: 20, transition: { duration: 0.18 } },
};

function Field({ label, id, type = 'text', value, onChange, placeholder, icon: Icon }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={isPassword ? 'current-password' : 'off'}
          required
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e8e8f0',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(255,16,160,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,16,160,0.08)'; }}
          onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
            {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthModal() {
  const { modalOpen, modalMode, closeModal, login, signup, loginWithGoogle, isFirebaseReady } = useAuth();
  const [mode,        setMode]        = useState(modalMode);
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  // Sync mode from context
  useState(() => { setMode(modalMode); }, [modalMode]);

  const clearForm = () => { setName(''); setEmail(''); setPassword(''); setError(''); };

  const switchMode = (m) => { setMode(m); clearForm(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFirebaseReady) {
      setError('Firebase not configured. See README for setup instructions.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(email, password, name);
      clearForm();
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password.'
                : err.code === 'auth/email-already-in-use' ? 'Email already in use.'
                : err.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
                : err.code === 'auth/user-not-found' ? 'No account with this email.'
                : err.message || 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!isFirebaseReady) { setError('Firebase not configured. See README for setup.'); return; }
    setError('');
    setLoading(true);
    try { await loginWithGoogle(); }
    catch (err) { setError(err.message || 'Google sign-in failed.'); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          key="auth-backdrop"
          variants={BACKDROP} initial="hidden" animate="visible" exit="exit"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(4,4,8,0.85)', backdropFilter: 'blur(16px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <motion.div
            key="auth-panel"
            variants={PANEL} initial="hidden" animate="visible" exit="exit"
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(145deg,#0f0f1e,#13131f)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div className="relative px-8 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)' }}>
                  <HiSparkles className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white">
                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">CineVerse AI · Your cinema universe</p>
                </div>
              </div>
              <button onClick={closeModal}
                className="absolute top-6 right-6 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all">
                <FiX size={16} />
              </button>
            </div>

            <div className="px-8 py-6 space-y-4">
              {/* Mode tabs */}
              <div className="flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['login', 'signup'].map(m => (
                  <button key={m} onClick={() => switchMode(m)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
                    style={mode === m
                      ? { background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)', color: '#fff', boxShadow: '0 4px 16px rgba(255,16,160,0.3)' }
                      : { color: '#888' }}>
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* Google button */}
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <FcGoogle size={18} />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <span className="text-xs text-gray-600">or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <AnimatePresence>
                  {mode === 'signup' && (
                    <motion.div key="name-field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Field label="Full Name" id="auth-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" icon={FiUser} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <Field label="Email" id="auth-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" icon={FiMail} />
                <Field label="Password" id="auth-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" icon={FiLock} />

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div key="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2 p-3 rounded-xl text-xs text-red-400"
                      style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <FiAlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#ff10a0,#8b5cf6)', boxShadow: '0 4px 20px rgba(255,16,160,0.35)' }}>
                  {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-xs text-gray-600 pt-1">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
