/**
 * useWatchlist.js — Pure re-export, NO JSX.
 *
 * Root cause of the Vite OXC parse error:
 *   JSX (<WatchlistContext.Provider>) cannot live in a .js file.
 *   Vite only enables JSX parsing for .jsx / .tsx extensions.
 *
 * Fix:
 *   All JSX + the Provider component moved to WatchlistContext.jsx
 *   This file re-exports everything so all existing imports work
 *   unchanged — no other files need to be touched.
 */
export { WatchlistProvider, useWatchlist, WatchlistContext } from './WatchlistContext.jsx';
