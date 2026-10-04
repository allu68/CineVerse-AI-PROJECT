import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { getHomeSections, getTrendingHero } from '../services/api';
import HeroCarousel from '../components/HeroCarousel';
import MovieRow from '../components/MovieRow';

const SECTIONS = [
  { key: 'trending',   title: 'Trending This Week', icon: '🔥' },
  { key: 'telugu',     title: 'Telugu Blockbusters', icon: '🎬' },
  { key: 'hindi',      title: 'Bollywood Hits',      icon: '🎭' },
  { key: 'tamil',      title: 'Tamil Cinema',        icon: '🌟' },
  { key: 'malayalam',  title: 'Malayalam Gems',      icon: '💎' },
  { key: 'kannada',    title: 'Kannada Hits',        icon: '🏆' },
  { key: 'topRated',   title: 'Top Rated All Time',  icon: '⭐' },
  { key: 'action',     title: 'Action & Thrill',     icon: '💥' },
  { key: 'romance',    title: 'Romance & Drama',     icon: '❤️' },
  { key: 'nowPlaying', title: 'Now Playing',         icon: '🎥' },
  { key: 'upcoming',   title: 'Coming Soon',         icon: '🚀' },
];

export default function Home() {
  const { data: heroData, isLoading: heroLoading } = useQuery({
    queryKey: ['hero'],
    queryFn: getTrendingHero,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['home-sections'],
    queryFn: getHomeSections,
    staleTime: 5 * 60 * 1000,
  });

  const heroMovies = heroData?.results || [];

  return (
    <>
      <Helmet>
        <title>CineVerse AI — Discover Cinema Intelligently</title>
      </Helmet>

      <main>
        {/* Hero Carousel */}
        <HeroCarousel movies={heroMovies} isLoading={heroLoading} />

        {/* Movie Sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="py-6 space-y-8"
        >
          {SECTIONS.map(({ key, title, icon }) => (
            <MovieRow
              key={key}
              title={title}
              icon={icon}
              movies={sections?.[key] || []}
              isLoading={sectionsLoading}
            />
          ))}
        </motion.div>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/5 py-8 px-6 md:px-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold gradient-text">CineVerse AI</span>
              <span className="text-gray-600 text-sm">— Discover Cinema Intelligently</span>
            </div>
            <p className="text-gray-600 text-xs">
              Powered by TMDB API • Built with React + FastAPI • AI Recommendations
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
