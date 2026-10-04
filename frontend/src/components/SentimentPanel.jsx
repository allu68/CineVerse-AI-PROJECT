import { motion } from 'framer-motion';
import { FiSmile, FiFrown, FiMeh, FiThumbsUp, FiThumbsDown, FiMessageCircle } from 'react-icons/fi';

const SENTIMENT_CONFIG = {
  positive: { icon: FiSmile, color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)', label: 'Positive' },
  negative: { icon: FiFrown, color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', label: 'Negative' },
  neutral:  { icon: FiMeh,   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', label: 'Neutral' },
  mixed:    { icon: FiMeh,   color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',  label: 'Mixed' },
};

function SentimentBar({ label, value, color, max = 100 }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-cinema-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const cfg = SENTIMENT_CONFIG[review.sentiment] || SENTIMENT_CONFIG.neutral;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <Icon size={13} style={{ color: cfg.color }} />
          </div>
          <span className="text-sm font-semibold text-white">{review.author}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs font-semibold" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(review.confidence * 100)}%
          </span>
        </div>
      </div>
      <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">{review.content}</p>
    </motion.div>
  );
}

export default function SentimentPanel({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="p-6 glass rounded-2xl space-y-4">
        <div className="h-6 skeleton rounded w-40" />
        <div className="h-24 skeleton rounded-xl" />
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="p-6 glass rounded-2xl text-center">
        <FiMessageCircle size={28} className="text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No reviews to analyze yet.</p>
      </div>
    );
  }

  const cfg = SENTIMENT_CONFIG[data.overall] || SENTIMENT_CONFIG.neutral;
  const OverallIcon = cfg.icon;

  return (
    <div className="space-y-4">
      {/* Overall sentiment card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-5 rounded-2xl border"
        style={{ background: cfg.bg, borderColor: cfg.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${cfg.color}22` }}>
              <OverallIcon size={22} style={{ color: cfg.color }} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Overall Sentiment</p>
              <p className="text-xl font-display font-bold" style={{ color: cfg.color }}>
                {cfg.label}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display font-black text-white">{data.total}</p>
            <p className="text-xs text-gray-500">reviews analyzed</p>
          </div>
        </div>

        {/* Bars */}
        <div className="space-y-2.5">
          <SentimentBar label="Positive" value={data.positive_pct || 0} color="#4ade80" />
          <SentimentBar label="Negative" value={data.negative_pct || 0} color="#f87171" />
          <SentimentBar label="Neutral"  value={data.neutral_pct  || 0} color="#94a3b8" />
        </div>

        {/* Counts */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-sm">
            <FiThumbsUp size={13} className="text-green-400" />
            <span className="text-gray-300">{data.positive_count} positive</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <FiThumbsDown size={13} className="text-red-400" />
            <span className="text-gray-300">{data.negative_count} negative</span>
          </div>
        </div>
      </motion.div>

      {/* Individual Reviews */}
      {data.analyzed_reviews?.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Analyzed Reviews</h4>
          {data.analyzed_reviews.slice(0, 5).map((rev, i) => (
            <ReviewCard key={rev.id || i} review={rev} />
          ))}
        </div>
      )}
    </div>
  );
}
