import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { isFirebaseReady, auth, googleProvider } from '../services/firebase';

// Lazy-import Firebase auth methods only when Firebase is ready
let _signInEmail   = null;
let _createEmail   = null;
let _signInPopup   = null;
let _signOut       = null;
let _onAuthChanged = null;
let _updateProfile = null;

if (isFirebaseReady) {
  import('firebase/auth').then(mod => {
    _signInEmail   = mod.signInWithEmailAndPassword;
    _createEmail   = mod.createUserWithEmailAndPassword;
    _signInPopup   = mod.signInWithPopup;
    _signOut       = mod.signOut;
    _onAuthChanged = mod.onAuthStateChanged;
    _updateProfile = mod.updateProfile;
  });
}

/* ── Context ────────────────────────────────────────────────── */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [modalMode,   setModalMode]   = useState('login');

  /* Subscribe to Firebase auth state */
  useEffect(() => {
    if (!isFirebaseReady || !auth) {
      setAuthLoading(false);
      return;
    }
    // _onAuthChanged may not be loaded yet — poll briefly
    const trySubscribe = (attempts = 0) => {
      if (_onAuthChanged) {
        const unsub = _onAuthChanged(auth, u => {
          setUser(u);
          setAuthLoading(false);
        });
        return unsub;
      }
      if (attempts < 10) setTimeout(() => trySubscribe(attempts + 1), 100);
      else setAuthLoading(false);
    };
    const unsub = trySubscribe();
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  /* Modal helpers */
  const openLogin  = useCallback(() => { setModalMode('login');  setModalOpen(true); }, []);
  const openSignup = useCallback(() => { setModalMode('signup'); setModalOpen(true); }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  /* Auth actions */
  const login = useCallback(async (email, password) => {
    if (!isFirebaseReady || !_signInEmail) throw new Error('Firebase not configured');
    await _signInEmail(auth, email, password);
    toast.success('Welcome back! 🎬');
    setModalOpen(false);
  }, []);

  const signup = useCallback(async (email, password, displayName) => {
    if (!isFirebaseReady || !_createEmail) throw new Error('Firebase not configured');
    const cred = await _createEmail(auth, email, password);
    if (displayName && _updateProfile) {
      await _updateProfile(cred.user, { displayName });
    }
    toast.success(`Welcome to CineVerse AI, ${displayName || 'cinephile'}! 🎉`);
    setModalOpen(false);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseReady || !_signInPopup) throw new Error('Firebase not configured');
    await _signInPopup(auth, googleProvider);
    toast.success('Signed in with Google! 🎬');
    setModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    if (!isFirebaseReady || !_signOut) return;
    await _signOut(auth);
    setUser(null);
    toast('Signed out', { icon: '👋' });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, authLoading, isFirebaseReady,
      modalOpen, modalMode,
      openLogin, openSignup, closeModal,
      login, signup, loginWithGoogle, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
