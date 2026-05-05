import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  TrendingUp,
  Rocket,
  RefreshCw,
  MessageSquare,
  Leaf,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { bounties as allBounties } from '../data/bounties';
import { expansions as seedExpansions } from '../data/expansions';
import { users } from '../data/users';
import type { Expansion } from '../data/expansions';

/* ─────────────── Types ─────────────── */
interface CommunityExpansion extends Expansion {
  commentCount?: number;
}

/* ─────────────── localStorage Helpers ─────────────── */
const LS_KEY = 'prompt-forge-community-v1';

function getStoredExpansions(): CommunityExpansion[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return data.expansions || [];
  } catch {
    return [];
  }
}

function getStoredLikes(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`${LS_KEY}-likes`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function storeLike(id: string, liked: boolean) {
  const likes = getStoredLikes();
  if (liked) likes[id] = true;
  else delete likes[id];
  localStorage.setItem(`${LS_KEY}-likes`, JSON.stringify(likes));
}

/* ─────────────── CountUp Hook ─────────────── */
function useCountUp(end: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    let raf: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);

  return { count, ref };
}

/* ─────────────── Merge Data ─────────────── */
function useCommunityData() {
  return useMemo(() => {
    const stored = getStoredExpansions();
    const merged: CommunityExpansion[] = [
      ...seedExpansions.map((e) => ({ ...e, commentCount: Math.floor(Math.random() * 8) })),
      ...stored,
    ];
    return merged;
  }, []);
}

/* ─────────────── Hero Section ─────────────── */
function HeroSection() {
  const expCount = useCountUp(24, 1200);
  const convCount = useCountUp(12, 1200);
  const discCount = useCountUp(89, 1200);

  return (
    <section
      className="relative py-[6rem] md:py-[8rem] px-4"
      style={{
        backgroundImage:
          'linear-gradient(rgba(250,250,249,0.92), rgba(250,250,249,0.92)), url(/community-garden.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'soft-light',
      }}
    >
      <div className="max-w-[900px] mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="font-inter text-xs font-medium tracking-[0.12em] uppercase text-moss-500 mb-4"
        >
          🌿 COMMUNITY
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="font-playfair text-[clamp(2rem,5vw,3.5rem)] font-bold text-moss-900 leading-tight mb-4"
        >
          The Community Garden
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="font-inter text-lg text-stone-700 max-w-[560px] mx-auto leading-relaxed mb-10"
        >
          Every bounty is a seed. Here you&apos;ll find what others have grown — expansions,
          conversions, and wild new branches.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-center gap-8 md:gap-12"
        >
          <div ref={expCount.ref} className="text-center">
            <div className="font-inter text-2xl font-bold text-moss-800">{expCount.count}</div>
            <div className="text-sm text-stone-500 font-medium">🚀 Expansions</div>
          </div>
          <div ref={convCount.ref} className="text-center">
            <div className="font-inter text-2xl font-bold text-moss-800">{convCount.count}</div>
            <div className="text-sm text-stone-500 font-medium">🔄 Conversions</div>
          </div>
          <div ref={discCount.ref} className="text-center">
            <div className="font-inter text-2xl font-bold text-moss-800">{discCount.count}</div>
            <div className="text-sm text-stone-500 font-medium">💬 Discussions</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── Leaderboard Bar ─────────────── */
function LeaderboardBar() {
  const expansions = useCommunityData();

  const contributors = useMemo(() => {
    const stats: Record<
      string,
      { user: (typeof users)[number]; expansions: number; likes: number }
    > = {};

    expansions.forEach((exp) => {
      const user = users.find((u) => u.id === exp.authorId);
      if (!user) return;
      if (!stats[user.id]) stats[user.id] = { user, expansions: 0, likes: 0 };
      stats[user.id].expansions += 1;
      stats[user.id].likes += exp.likes;
    });

    return Object.values(stats)
      .sort((a, b) => b.expansions - a.expansions || b.likes - a.likes)
      .slice(0, 7);
  }, [expansions]);

  const rankStyles = [
    { bg: 'bg-amber-300', text: 'text-amber-900', border: 'border-amber-400' },
    { bg: 'bg-stone-300', text: 'text-stone-800', border: 'border-stone-400' },
    {bg: 'bg-amber-700', text: 'text-amber-100', border: 'border-amber-800' },
  ];

  return (
    <section className="bg-cream py-6">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="font-inter text-xs font-medium tracking-wide text-stone-500 uppercase mb-4"
        >
          🏆 Top Forgers This Month
        </motion.p>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {contributors.map((c, i) => (
            <motion.div
              key={c.user.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
              className="flex-shrink-0 min-w-[160px] bg-stone-100 rounded-card p-4 border border-transparent hover:border-moss-300 hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-spring cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <img
                    src={c.user.avatar}
                    alt={c.user.username}
                    className="w-12 h-12 rounded-full bg-stone-200 object-cover"
                  />
                  {i < 3 && (
                    <span
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-stone-100 ${rankStyles[i].bg} ${rankStyles[i].text}`}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800 leading-tight">
                    {c.user.username}
                  </p>
                  <p className="text-xs text-stone-500">
                    🚀 {c.expansions} · ❤️ {c.likes}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Filter Tabs ─────────────── */
type FilterTab = 'all' | 'expansions' | 'conversions' | 'discussions' | 'trending';

const tabs: { value: FilterTab; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Leaf size={14} /> },
  { value: 'expansions', label: 'Expansions', icon: <Rocket size={14} /> },
  { value: 'conversions', label: 'Conversions', icon: <RefreshCw size={14} /> },
  { value: 'discussions', label: 'Discussions', icon: <MessageSquare size={14} /> },
  { value: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
];

function FilterTabs({
  active,
  onChange,
}: {
  active: FilterTab;
  onChange: (tab: FilterTab) => void;
}) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tabRefs.current[active];
    if (!el || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setIndicator({
      left: rect.left - containerRect.left,
      width: rect.width,
    });
  }, [active]);

  return (
    <div className="bg-stone-50 pt-6">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
        <div ref={containerRef} className="relative flex items-center gap-1 md:gap-2 overflow-x-auto pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              ref={(el) => { tabRefs.current[tab.value] = el; }}
              onClick={() => onChange(tab.value)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-[8px] font-inter text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                active === tab.value
                  ? 'text-moss-700'
                  : 'text-stone-500 hover:text-moss-600 hover:bg-stone-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <motion.div
            className="absolute bottom-0 h-[2px] bg-moss-500 rounded-full"
            animate={{
              left: indicator.left,
              width: indicator.width,
            }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Expansion Card ─────────────── */
function ExpansionCard({
  exp,
  index,
}: {
  exp: CommunityExpansion;
  index: number;
}) {
  const parent = allBounties.find((b) => b.id === exp.parentBountyId);
  const author = users.find((u) => u.id === exp.authorId);
  const likes = getStoredLikes();
  const [liked, setLiked] = useState(!!likes[exp.id]);
  const [likeCount, setLikeCount] = useState(exp.likes);
  const [copied, setCopied] = useState(false);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : c - 1));
    storeLike(exp.id, newLiked);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/#/bounty/${exp.parentBountyId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(parseISO(exp.createdAt), { addSuffix: true });
    } catch {
      return exp.createdAt;
    }
  }, [exp.createdAt]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
      className="bg-stone-100 rounded-card p-6 border border-stone-200 hover:border-moss-300 hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-spring flex flex-col"
    >
      {/* Badge + Parent */}
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-[9999px] bg-green-100 text-green-700 text-[10px] font-semibold uppercase tracking-wide">
          Expansion
        </span>
        {parent && (
          <Link
            to={`/bounty/${parent.id}`}
            className="text-xs text-moss-600 hover:text-moss-800 font-medium truncate transition-colors"
          >
            🌱 From: {parent.title}
          </Link>
        )}
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown'}
          alt={author?.username || 'Unknown'}
          className="w-9 h-9 rounded-full bg-stone-200 object-cover"
        />
        <div>
          <p className="text-sm font-semibold text-stone-800">{author?.username || 'Unknown'}</p>
          <p className="text-xs text-stone-500">expanded {timeAgo}</p>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-inter text-base font-semibold text-moss-900 mb-2 leading-snug">
        {exp.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-stone-600 leading-relaxed line-clamp-4 flex-1 mb-4">
        {exp.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`inline-flex items-center gap-1 text-xs font-medium transition-all duration-200 ${
              liked ? 'text-moss-600' : 'text-stone-500 hover:text-moss-600'
            }`}
          >
            <Heart size={14} className={liked ? 'fill-moss-600' : ''} />
            {likeCount}
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-stone-500">
            <MessageCircle size={14} />
            {exp.commentCount || 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-stone-400 hover:text-moss-600 hover:bg-moss-100 transition-colors"
            title="Copy link"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <Link
            to={`/bounty/${exp.parentBountyId}`}
            className="px-3 py-1.5 rounded-[8px] bg-moss-700 text-cream text-xs font-medium hover:bg-moss-800 transition-colors duration-200"
          >
            View Full
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── Discussion Card ─────────────── */
function DiscussionCard({
  bounty,
  index,
}: {
  bounty: (typeof allBounties)[number];
  index: number;
}) {
  const topComment = bounty.comments[0];
  const author = topComment ? users.find((u) => u.id === topComment.authorId) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
      className="bg-stone-100 rounded-card p-6 border border-stone-200 hover:border-moss-300 hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-spring flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-[9999px] bg-moss-100 text-moss-700 text-[10px] font-semibold uppercase tracking-wide">
          Discussion
        </span>
        <Link
          to={`/bounty/${bounty.id}`}
          className="text-xs text-moss-600 hover:text-moss-800 font-medium truncate transition-colors"
        >
          {bounty.title}
        </Link>
      </div>

      {topComment ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            <img
              src={author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown'}
              alt={author?.username || 'Unknown'}
              className="w-9 h-9 rounded-full bg-stone-200 object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-stone-800">{author?.username || 'Unknown'}</p>
              <p className="text-xs text-stone-500">{topComment.createdAt}</p>
            </div>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed line-clamp-4 flex-1 mb-4">
            {topComment.text}
          </p>
        </>
      ) : (
        <p className="text-sm text-stone-500 italic flex-1 mb-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-stone-200">
        <span className="inline-flex items-center gap-1 text-xs text-stone-500">
          <MessageCircle size={14} />
          {bounty.comments.length} comments
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-stone-500">
          👁️ {bounty.views} views
        </span>
      </div>
    </motion.div>
  );
}

/* ─────────────── Conversion Card (Mock) ─────────────── */
function ConversionCard({
  bounty,
  index,
}: {
  bounty: (typeof allBounties)[number];
  index: number;
}) {
  const formats = ['Tweet Thread', 'Blog Post', 'Notion Doc'];
  const format = formats[index % formats.length];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
      className="bg-stone-100 rounded-card p-6 border border-stone-200 hover:border-moss-300 hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-spring flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-[9999px] bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-wide">
          Conversion
        </span>
        <Link
          to={`/bounty/${bounty.id}`}
          className="text-xs text-moss-600 hover:text-moss-800 font-medium truncate transition-colors"
        >
          From: {bounty.title}
        </Link>
      </div>

      <p className="text-sm font-semibold text-moss-900 mb-2">
        Converted to: {format}
      </p>

      <p className="text-sm text-stone-600 leading-relaxed line-clamp-4 flex-1 mb-4">
        {bounty.description.slice(0, 120)}...
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-stone-200">
        <span className="inline-flex items-center gap-1 text-xs text-stone-500">
          <Heart size={14} /> {Math.floor(bounty.likes * 0.3)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-stone-500">
          <Copy size={14} /> {Math.floor(bounty.views * 0.1)} copies
        </span>
      </div>
    </motion.div>
  );
}

/* ─────────────── Community Feed ─────────────── */
function CommunityFeed({ filter }: { filter: FilterTab }) {
  const expansions = useCommunityData();
  const [visibleCount, setVisibleCount] = useState(6);

  const items = useMemo(() => {
    switch (filter) {
      case 'expansions':
        return expansions.map((e) => ({ type: 'expansion' as const, data: e }));
      case 'conversions':
        return allBounties
          .filter((b) => b.expansions.length > 0)
          .slice(0, 6)
          .map((b) => ({ type: 'conversion' as const, data: b }));
      case 'discussions':
        return allBounties
          .filter((b) => b.comments.length > 0 || b.views > 100)
          .map((b) => ({ type: 'discussion' as const, data: b }));
      case 'trending':
        return [...expansions]
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 6)
          .map((e) => ({ type: 'expansion' as const, data: e }));
      default:
        return [
          ...expansions.map((e) => ({ type: 'expansion' as const, data: e })),
          ...allBounties
            .filter((b) => b.expansions.length > 0)
            .slice(0, 4)
            .map((b) => ({ type: 'conversion' as const, data: b })),
          ...allBounties
            .filter((b) => b.comments.length > 0)
            .slice(0, 4)
            .map((b) => ({ type: 'discussion' as const, data: b })),
        ].sort(() => Math.random() - 0.5);
    }
  }, [filter, expansions]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <section className="bg-stone-50 py-8">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, i) =>
              item.type === 'expansion' ? (
                <ExpansionCard
                  key={item.data.id}
                  exp={item.data}
                  index={i}
                />
              ) : item.type === 'discussion' ? (
                <DiscussionCard key={item.data.id} bounty={item.data} index={i} />
              ) : (
                <ConversionCard key={item.data.id} bounty={item.data} index={i} />
              )
            )}
          </AnimatePresence>
        </div>

        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🌱</div>
            <p className="text-stone-500 max-w-md mx-auto">
              Nothing here yet. Be the first to plant a seed!
            </p>
          </motion.div>
        )}

        {visibleCount < items.length && (
          <div className="text-center mt-10">
            <button
              onClick={() => setVisibleCount((c) => c + 6)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[8px] border-2 border-moss-700 text-moss-700 font-inter font-medium hover:bg-moss-50 transition-all duration-200"
            >
              Load More Activity <ChevronDown size={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────── Share Your Work CTA ─────────────── */
function ShareWorkCTA() {
  return (
    <section className="bg-moss-900 py-[4rem] md:py-[6rem] px-4">
      <div className="max-w-[800px] mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-cream mb-4"
        >
          Grown Something? Share It.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="font-inter text-lg text-moss-300 max-w-[560px] mx-auto mb-8"
        >
          Expanded a bounty? Converted it to a new format? We&apos;d love to see what
          you&apos;ve built.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[8px] bg-amber-300 text-moss-900 font-inter font-medium hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-spring"
          >
            🚀 Publish an Expansion
          </Link>
          <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[8px] border-2 border-cream text-cream font-inter font-medium hover:bg-moss-800 transition-all duration-200">
            🔄 Share a Conversion
          </button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── Trending Tags ─────────────── */
function TrendingTags() {
  const tags = useMemo(() => {
    const counts: Record<string, number> = {};
    allBounties.forEach((b) =>
      b.tags.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      })
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, count]) => ({
        tag,
        count,
        size: count >= 4 ? 'text-lg' : count >= 2 ? 'text-base' : 'text-sm',
        color:
          count >= 4
            ? 'text-moss-900'
            : count >= 2
              ? 'text-moss-700'
              : 'text-moss-500',
      }));
  }, []);

  return (
    <section className="bg-stone-50 py-8 px-4">
      <div className="max-w-[1000px] mx-auto">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="font-playfair text-2xl font-semibold text-moss-900 mb-6"
        >
          🔥 Trending in the Garden
        </motion.h3>

        <div className="flex flex-wrap items-center gap-3">
          {tags.map((t, i) => (
            <motion.button
              key={t.tag}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ scale: 1.1 }}
              className={`px-4 py-2 rounded-[9999px] bg-stone-100 hover:bg-moss-100 hover:shadow-sm transition-all duration-200 font-medium ${t.size} ${t.color}`}
            >
              {t.tag} <span className="text-stone-400 text-xs ml-1">({t.count})</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Main Page ─────────────── */
export default function Community() {
  const [filter, setFilter] = useState<FilterTab>('all');

  return (
    <div>
      <HeroSection />
      <LeaderboardBar />
      <FilterTabs active={filter} onChange={setFilter} />
      <CommunityFeed filter={filter} />
      <ShareWorkCTA />
      <TrendingTags />
    </div>
  );
}
