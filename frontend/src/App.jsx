import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import AuthModal from './components/AuthModal';

// Lazy-loaded pages — only downloaded when navigated to
const Home       = lazy(() => import('./pages/Home'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const Browse     = lazy(() => import('./pages/Browse'));
const Search     = lazy(() => import('./pages/Search'));
const Watchlist  = lazy(() => import('./pages/Watchlist'));
const AiChat     = lazy(() => import('./pages/AiChat'));
const NotFound   = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#ff10a0', borderTopColor: 'transparent' }} />
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-cinema-dark">
      <Navbar />
      {/* Global auth modal — rendered outside route tree so it persists */}
      <AuthModal />
      <ErrorBoundary fallbackMessage="The page failed to load. Please refresh.">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"          element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="/movie/:id" element={<ErrorBoundary fallbackMessage="Movie details failed to load."><MovieDetail /></ErrorBoundary>} />
            <Route path="/browse"    element={<ErrorBoundary><Browse /></ErrorBoundary>} />
            <Route path="/search"    element={<ErrorBoundary><Search /></ErrorBoundary>} />
            <Route path="/watchlist" element={<ErrorBoundary><Watchlist /></ErrorBoundary>} />
            <Route path="/ai-chat"   element={<ErrorBoundary><AiChat /></ErrorBoundary>} />
            <Route path="*"          element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
