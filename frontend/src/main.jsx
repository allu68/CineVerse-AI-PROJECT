import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { WatchlistProvider } from './hooks/useWatchlist';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <WatchlistProvider>
          <AuthProvider>
            <BrowserRouter>
              <App />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#13131f',
                    color: '#e8e8f0',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    fontSize: '14px',
                  },
                  success: { iconTheme: { primary: '#4ade80', secondary: '#13131f' } },
                  error:   { iconTheme: { primary: '#f87171', secondary: '#13131f' } },
                }}
              />
            </BrowserRouter>
          </AuthProvider>
        </WatchlistProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
