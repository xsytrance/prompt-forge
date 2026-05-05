import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  CheckCircle,
  Rocket,
  MessageCircle,
  Bookmark,
  Trophy,
  Flame,
  Copy,
  Check,
  Pencil,
  UserPlus,
  Calendar,
  Zap,
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { bounties as allBounties } from '../data/bounties';
import { expansions as seedExpansions } from '../data/expansions';
import { users } from '../data/users';
import { interactions } from '../data/interactions';
import type { Bounty, Difficulty } from '../data/bounties';

/* ─────────────── Types ─────────────── */
type TabValue = 'activity' | 'completed' | 'favorites' | 'expansions' | 'stats';

interface ProfileData {
  bio: string;
  avatarEmoji: string;
  joinedAt: string;
}

interface ActivityEvent {
  id: string;
  type: 'like' | 'complete' | 'expansion' | 'comment' | 'bookmark' | 'join';
  bountyId?: string;
  bountyTitle?: string;
  expansionTitle?: string;
  timestamp: string;
}

/* ─────────────── localStorage Helpers ─────────────── */
const LS_KEY = 'prompt-forge-v1';
const PROFILE_LS_KEY = 'prompt-forge-profiles-v1';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.currentUser || null;
  } catch {
    return null;
  }
}

function getProfileData(username: string): ProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_LS_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    if (stored[username]) return stored[username];
  } catch {
    // ignore
  }
  const user = users.find((u) => u.username === username);
  return {
    bio: `Forging AI ideas into reality. ${username} enthusiast. Bounty planter.`,
    avatarEmoji: '👤',
    joinedAt: user?.joinedAt || new Date().toISOString().slice(0, 10),
  };
}

function storeProfileData(username: string, data: ProfileData) {
  try {
    const raw = localStorage.getItem(PROFILE_LS_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[username] = data;
    localStorage.setItem(PROFILE_LS_KEY, JSON.stringify(stored));
  } catch {
    // ignore
  }
}

/* ─────────────── CountUp Hook ─────────────── */
function useCountUp(end: number, duration = 1000, trigger = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
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
  }, [end, duration, trigger]);
  return count;
}

/* ─────────────── Difficulty Badge (for bounty cards) ─────────────── */
function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = {
    easy: { emoji: '🌱', label: 'Beginner', bg: 'bg-green-100', text: 'text-green-700' },
    medium: { emoji: '🌿', label: 'Intermediate', bg: 'bg-amber-100', text: 'text-amber-700' },
    hard: { emoji: '🌳', label: 'Advanced', bg: 'bg-red-100', text: 'text-red-700' },
  }[difficulty];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[9999px] text-[10px] font-semibold ${config.bg} ${config.text}`}>
      {config.emoji} {config.label}
    </span>
  );
}

/* ─────────────── Profile Header ─────────────── */
function ProfileHeader({
  user,
  isOwner,
  profileData,
  onEdit,
}: {
  user: (typeof users)[number] | undefined;
  isOwner: boolean;
  profileData: ProfileData;
  onEdit: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState(false);

  const handleCopyProfile = () => {
    const url = `${window.location.origin}/#/profile/${user?.username || ''}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const completedCount = useMemo(
    () => interactions.filter((i) => i.userId === user?.id && i.type === 'complete').length,
    [user]
  );
  const favoritesCount = useMemo(
    () => interactions.filter((i) => i.userId === user?.id && i.type === 'bookmark').length,
    [user]
  );
  const expansionsCount = useMemo(
    () => seedExpansions.filter((e) => e.authorId === user?.id).length,
    [user]
  );
  const points = useMemo(
    () => completedCount * 100 + favoritesCount * 10 + expansionsCount * 50,
    [completedCount, favoritesCount, expansionsCount]
  );

  const joinDate = useMemo(() => {
    try {
      return format(parseISO(profileData.joinedAt), 'MMMM yyyy');
    } catch {
      return 'January 2024';
    }
  }, [profileData.joinedAt]);

  const initials = (user?.username || '??').slice(0, 2).toUpperCase();

  return (
    <section className="relative pt-[6rem] pb-[3rem] px-4 bg-gradient-to-b from-moss-50 to-cream">
      <div className="max-w-[800px] mx-auto text-center">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-[120px] h-[120px] mx-auto mb-4 rounded-full bg-moss-200 border-4 border-stone-100 shadow-md flex items-center justify-center"
        >
          <span className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-800">
            {initials}
          </span>
        </motion.div>

        {/* Username */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-900 mb-2"
        >
          {user?.username || 'Unknown'}
        </motion.h1>

        {/* Join Date */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="text-sm text-stone-500 mb-3"
        >
          🌱 Member since {joinDate}
        </motion.p>

        {/* Bio */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="font-inter text-base text-stone-700 italic max-w-[480px] mx-auto mb-6 leading-relaxed"
        >
          {profileData.bio}
        </motion.p>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-wrap items-center justify-center gap-3 mb-4"
        >
          {[
            { icon: <CheckCircle size={14} />, label: 'Completed', value: completedCount },
            { icon: <Heart size={14} />, label: 'Favorites', value: favoritesCount },
            { icon: <Rocket size={14} />, label: 'Expansions', value: expansionsCount },
            { icon: <Flame size={14} />, label: 'Points', value: points },
          ].map((stat) => (
            <span
              key={stat.label}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[9999px] bg-stone-100 text-stone-700 text-sm font-medium shadow-sm"
            >
              {stat.icon} {stat.value} {stat.label}
            </span>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-center gap-3"
        >
          {isOwner ? (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] border-2 border-moss-700 text-moss-700 text-sm font-medium hover:bg-moss-50 transition-all duration-200"
            >
              <Pencil size={14} /> Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setFollowing(!following)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-medium transition-all duration-200 ${
                following
                  ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  : 'bg-moss-700 text-cream hover:bg-moss-800'
              }`}
            >
              <UserPlus size={14} />
              {following ? 'Following' : 'Follow'}
            </button>
          )}
          <button
            onClick={handleCopyProfile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] border-2 border-stone-200 text-stone-600 text-sm font-medium hover:border-moss-300 hover:text-moss-700 transition-all duration-200"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Share Profile'}
          </button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── Tab Navigation ─────────────── */
const tabs: { value: TabValue; label: string; icon: React.ReactNode }[] = [
  { value: 'activity', label: 'Activity', icon: <Zap size={14} /> },
  { value: 'completed', label: 'Completed', icon: <CheckCircle size={14} /> },
  { value: 'favorites', label: 'Favorites', icon: <Heart size={14} /> },
  { value: 'expansions', label: 'Expansions', icon: <Rocket size={14} /> },
  { value: 'stats', label: 'Stats', icon: <Trophy size={14} /> },
];

function TabNavigation({
  active,
  onChange,
}: {
  active: TabValue;
  onChange: (tab: TabValue) => void;
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
    <div className="bg-stone-50 border-b border-stone-200">
      <div className="max-w-[800px] mx-auto px-4">
        <div ref={containerRef} className="relative flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              ref={(el) => { tabRefs.current[tab.value] = el; }}
              onClick={() => onChange(tab.value)}
              className={`relative flex items-center gap-1.5 px-4 py-3 font-inter text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                active === tab.value
                  ? 'text-moss-700'
                  : 'text-stone-500 hover:text-moss-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <motion.div
            className="absolute bottom-0 h-[2px] bg-moss-500 rounded-full"
            animate={{ left: indicator.left, width: indicator.width }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Activity Timeline ─────────────── */
function ActivityTimeline({ userId }: { userId?: string }) {
  const events = useMemo<ActivityEvent[]>(() => {
    const result: ActivityEvent[] = [];

    // Join event
    const user = users.find((u) => u.id === userId);
    if (user) {
      result.push({
        id: `join-${user.id}`,
        type: 'join',
        timestamp: user.joinedAt,
      });
    }

    // Interaction events
    interactions
      .filter((i) => i.userId === userId)
      .forEach((i) => {
        const bounty = allBounties.find((b) => b.id === i.bountyId);
        result.push({
          id: `int-${i.userId}-${i.bountyId}-${i.type}-${i.timestamp}`,
          type: i.type,
          bountyId: i.bountyId,
          bountyTitle: bounty?.title,
          timestamp: i.timestamp,
        });
      });

    // Expansion events
    seedExpansions
      .filter((e) => e.authorId === userId)
      .forEach((e) => {
        result.push({
          id: `exp-${e.id}`,
          type: 'expansion',
          bountyId: e.parentBountyId,
          bountyTitle: allBounties.find((b) => b.id === e.parentBountyId)?.title,
          expansionTitle: e.title,
          timestamp: e.createdAt,
        });
      });

    return result.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [userId]);

  const iconMap: Record<ActivityEvent['type'], React.ReactNode> = {
    like: <Heart size={14} className="text-red-400" />,
    complete: <CheckCircle size={14} className="text-green-500" />,
    expansion: <Rocket size={14} className="text-moss-600" />,
    comment: <MessageCircle size={14} className="text-blue-400" />,
    bookmark: <Bookmark size={14} className="text-amber-500" />,
    join: <Calendar size={14} className="text-stone-400" />,
  };

  const labelMap: Record<ActivityEvent['type'], string> = {
    like: 'Liked',
    complete: 'Completed',
    expansion: 'Expanded',
    comment: 'Commented on',
    bookmark: 'Bookmarked',
    join: 'Joined Prompt Forge',
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🌱</div>
        <p className="text-stone-500">No activity yet. Go explore some bounties!</p>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-moss-200" />

        <div className="space-y-6">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="relative flex items-start gap-4"
            >
              {/* Dot */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.1 + 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative z-10 w-12 h-12 rounded-full bg-stone-100 border-2 border-moss-200 flex items-center justify-center flex-shrink-0"
              >
                {iconMap[event.type]}
              </motion.div>

              {/* Content */}
              <div className="flex-1 bg-stone-100 rounded-[8px] p-4 border border-stone-200">
                <p className="text-sm text-stone-800 leading-relaxed">
                  <span className="font-medium">{labelMap[event.type]}</span>
                  {event.bountyTitle && (
                    <>
                      {' '}
                      <Link
                        to={`/bounty/${event.bountyId}`}
                        className="text-moss-600 hover:text-moss-800 font-medium transition-colors"
                      >
                        {event.bountyTitle}
                      </Link>
                    </>
                  )}
                  {event.expansionTitle && (
                    <>
                      {' '}
                      into{' '}
                      <span className="font-medium text-moss-700">{event.expansionTitle}</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {formatDistanceToNow(parseISO(event.timestamp), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Bounty Card (Compact for profile) ─────────────── */
function CompactBountyCard({ bounty, index, badge }: { bounty: Bounty; index: number; badge?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link to={`/bounty/${bounty.id}`} className="block h-full">
        <div className="h-full bg-stone-100 border border-stone-200 rounded-card p-5 hover:border-moss-300 hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-spring flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <DifficultyBadge difficulty={bounty.difficulty} />
            <span className="text-xl">{bounty.emoji}</span>
          </div>
          {badge && <div className="mb-2">{badge}</div>}
          <h3 className="font-inter text-base font-bold text-moss-900 line-clamp-2 mb-2">
            {bounty.title}
          </h3>
          <p className="text-sm text-stone-500 line-clamp-3 flex-1">{bounty.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {bounty.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-[9999px] bg-moss-100 text-moss-700 text-[10px] font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────────── Completed Tab ─────────────── */
function CompletedTab({ userId }: { userId?: string }) {
  const completed = useMemo(() => {
    const ids = interactions
      .filter((i) => i.userId === userId && i.type === 'complete')
      .map((i) => i.bountyId);
    return allBounties.filter((b) => ids.includes(b.id));
  }, [userId]);

  const totalBounties = allBounties.length;
  const progress = totalBounties > 0 ? (completed.length / totalBounties) * 100 : 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="max-w-[600px] mx-auto mb-8">
        <p className="text-sm text-stone-600 mb-2 text-center">
          You&apos;ve completed {completed.length} of {totalBounties} bounties
        </p>
        <div className="h-3 bg-stone-200 rounded-[9999px] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="h-full bg-moss-500 rounded-[9999px]"
          />
        </div>
      </div>

      {completed.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-stone-500">No completed bounties yet. Time to forge!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {completed.map((bounty, i) => (
            <CompactBountyCard
              key={bounty.id}
              bounty={bounty}
              index={i}
              badge={
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[9999px] bg-green-100 text-green-700 text-[10px] font-semibold">
                  <CheckCircle size={10} /> Completed
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Favorites Tab ─────────────── */
function FavoritesTab({ userId }: { userId?: string }) {
  const favorites = useMemo(() => {
    const ids = interactions
      .filter((i) => i.userId === userId && i.type === 'bookmark')
      .map((i) => i.bountyId);
    return allBounties.filter((b) => ids.includes(b.id));
  }, [userId]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔖</div>
          <p className="text-stone-500">
            No favorites yet. Find something you love and hit the bookmark!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((bounty, i) => (
            <CompactBountyCard
              key={bounty.id}
              bounty={bounty}
              index={i}
              badge={
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[9999px] bg-amber-100 text-amber-700 text-[10px] font-semibold">
                  <Bookmark size={10} className="fill-amber-700" /> Favorited
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Expansions Tab ─────────────── */
function ExpansionsTab({ userId, isOwner }: { userId?: string; isOwner: boolean }) {
  const userExpansions = useMemo(
    () => seedExpansions.filter((e) => e.authorId === userId),
    [userId]
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {isOwner && (
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[8px] bg-moss-700 text-cream font-inter text-sm font-medium hover:bg-moss-800 transition-all duration-200"
          >
            <Rocket size={14} /> Start a New Expansion
          </Link>
        </div>
      )}

      {userExpansions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-stone-500">No expansions yet. Pick a bounty and expand it!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userExpansions.map((exp, i) => {
            const parent = allBounties.find((b) => b.id === exp.parentBountyId);
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                className="bg-stone-100 border border-stone-200 rounded-card p-6 hover:border-moss-300 hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-spring"
              >
                <Link
                  to={`/bounty/${exp.parentBountyId}`}
                  className="text-xs text-moss-600 hover:text-moss-800 font-medium mb-3 block transition-colors"
                >
                  🌱 From: {parent?.title}
                </Link>
                <h3 className="font-inter text-base font-semibold text-moss-900 mb-2">
                  {exp.title}
                </h3>
                <p className="text-sm text-stone-600 line-clamp-3 mb-4">{exp.description}</p>
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <span className="inline-flex items-center gap-1">
                    <Heart size={13} /> {exp.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={13} /> 0
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Activity Heatmap ─────────────── */
function ActivityHeatmap({ userId }: { userId?: string }) {
  const weeks = 12;
  const days = 7;

  const heatmapData = useMemo(() => {
    // Build activity map from interactions + expansions
    const activityMap: Record<string, number> = {};

    interactions
      .filter((i) => i.userId === userId)
      .forEach((i) => {
        activityMap[i.timestamp] = (activityMap[i.timestamp] || 0) + 1;
      });

    seedExpansions
      .filter((e) => e.authorId === userId)
      .forEach((e) => {
        activityMap[e.createdAt] = (activityMap[e.createdAt] || 0) + 2;
      });

    // Generate grid data for last 12 weeks
    const today = new Date();
    const grid: { date: string; count: number }[][] = [];

    for (let w = 0; w < weeks; w++) {
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < days; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (weeks - 1 - w) * 7 - (6 - d));
        const dateStr = format(date, 'yyyy-MM-dd');
        week.push({ date: dateStr, count: activityMap[dateStr] || 0 });
      }
      grid.push(week);
    }
    return grid;
  }, [userId]);

  const intensityClass = (count: number) => {
    if (count === 0) return 'bg-stone-200';
    if (count === 1) return 'bg-moss-100';
    if (count === 2) return 'bg-moss-300';
    if (count >= 3) return 'bg-moss-500';
    return 'bg-moss-700';
  };

  return (
    <div className="mb-8">
      <div className="flex gap-1">
        {heatmapData.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                title={`${day.date}: ${day.count} actions`}
                className={`w-3 h-3 rounded-[2px] ${intensityClass(day.count)} transition-colors duration-200 hover:ring-1 hover:ring-moss-400`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[2px] bg-stone-200" />
          <div className="w-3 h-3 rounded-[2px] bg-moss-100" />
          <div className="w-3 h-3 rounded-[2px] bg-moss-300" />
          <div className="w-3 h-3 rounded-[2px] bg-moss-500" />
          <div className="w-3 h-3 rounded-[2px] bg-moss-700" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

/* ─────────────── Stats Tab ─────────────── */
function StatsTab({ userId }: { userId?: string }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const completed = interactions.filter((i) => i.userId === userId && i.type === 'complete').length;
    const expansions = seedExpansions.filter((e) => e.authorId === userId).length;
    const comments = allBounties.reduce(
      (sum, b) => sum + b.comments.filter((c) => c.authorId === userId).length,
      0
    );
    const points = completed * 100 + expansions * 50 + comments * 10;

    return [
      { label: 'Bounties Completed', value: completed, trend: '↑ 3 this month', icon: <CheckCircle size={16} /> },
      { label: 'Expansions Created', value: expansions, trend: '↑ 1 this week', icon: <Rocket size={16} /> },
      { label: 'Comments Made', value: comments || 0, trend: 'steady', icon: <MessageCircle size={16} /> },
      { label: 'Total Points', value: points, trend: '↑ 150 this week', icon: <Flame size={16} /> },
    ];
  }, [userId]);

  const categoryBreakdown = useMemo(() => {
    const completedIds = interactions
      .filter((i) => i.userId === userId && i.type === 'complete')
      .map((i) => i.bountyId);
    const completed = allBounties.filter((b) => completedIds.includes(b.id));
    const counts: Record<string, number> = {};
    completed.forEach((b) => {
      b.tags.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [userId]);

  const maxCategory = categoryBreakdown[0]?.[1] || 1;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {stats.map((stat, i) => {
          const count = useCountUp(stat.value, 1000, animate);
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="bg-stone-100 rounded-card p-6 shadow-sm border border-stone-200"
            >
              <div className="flex items-center gap-2 text-stone-500 mb-2">
                {stat.icon}
                <span className="text-xs font-medium uppercase tracking-wide">{stat.label}</span>
              </div>
              <div className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-900 mb-1">
                {count.toLocaleString()}
              </div>
              <div className="text-xs text-moss-600 font-medium">{stat.trend}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-stone-100 rounded-card p-6 shadow-sm border border-stone-200 mb-8"
      >
        <h3 className="font-inter text-sm font-semibold text-stone-700 mb-4">
          Activity Heatmap
        </h3>
        <ActivityHeatmap userId={userId} />
      </motion.div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-stone-100 rounded-card p-6 shadow-sm border border-stone-200"
      >
        <h3 className="font-inter text-sm font-semibold text-stone-700 mb-4">
          What types of bounties do you complete?
        </h3>
        {categoryBreakdown.length === 0 ? (
          <p className="text-sm text-stone-500">Complete some bounties to see your breakdown!</p>
        ) : (
          <div className="space-y-3">
            {categoryBreakdown.map(([tag, count], i) => (
              <div key={tag}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-stone-700 capitalize">{tag}</span>
                  <span className="text-stone-500 font-medium">{count}</span>
                </div>
                <div className="h-2 bg-stone-200 rounded-[9999px] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCategory) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                    className="h-full bg-moss-500 rounded-[9999px]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ─────────────── Edit Profile Modal ─────────────── */
function EditProfileModal({
  isOpen,
  onClose,
  profileData,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onSave: (data: ProfileData) => void;
}) {
  const [bio, setBio] = useState(profileData.bio);
  const [emoji, setEmoji] = useState(profileData.avatarEmoji);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ ...profileData, bio, avatarEmoji: emoji });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
          className="relative bg-stone-50 rounded-modal p-6 w-full max-w-md shadow-xl border border-stone-200"
        >
          <h2 className="font-playfair text-xl font-semibold text-moss-900 mb-4">
            Edit Profile
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-[8px] border border-stone-200 bg-white text-stone-800 text-sm focus:border-moss-400 focus:outline-none resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Avatar Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
                className="w-full px-3 py-2 rounded-[8px] border border-stone-200 bg-white text-stone-800 text-sm focus:border-moss-400 focus:outline-none"
                placeholder="👤"
              />
              <p className="text-xs text-stone-500 mt-1">Enter an emoji for your avatar</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[8px] text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-[8px] bg-moss-700 text-cream text-sm font-medium hover:bg-moss-800 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────── Main Profile Page ─────────────── */
export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<TabValue>('activity');
  const [isEditOpen, setIsEditOpen] = useState(false);

  const user = users.find((u) => u.username === username);
  const currentUser = getCurrentUser();
  const isOwner = currentUser?.username === username;

  const [profileData, setProfileData] = useState<ProfileData>(() =>
    getProfileData(username || '')
  );

  const handleSaveProfile = useCallback(
    (data: ProfileData) => {
      setProfileData(data);
      if (username) storeProfileData(username, data);
    },
    [username]
  );

  // If user not found in seed, create a mock user for demo
  const displayUser = user || {
    id: 'unknown',
    username: username || 'unknown',
    email: '',
    password_hash: '',
    joinedAt: new Date().toISOString().slice(0, 10),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
  };

  return (
    <div>
      <ProfileHeader
        user={displayUser}
        isOwner={isOwner}
        profileData={profileData}
        onEdit={() => setIsEditOpen(true)}
      />

      <TabNavigation active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {activeTab === 'activity' && <ActivityTimeline userId={displayUser.id} />}
          {activeTab === 'completed' && <CompletedTab userId={displayUser.id} />}
          {activeTab === 'favorites' && <FavoritesTab userId={displayUser.id} />}
          {activeTab === 'expansions' && <ExpansionsTab userId={displayUser.id} isOwner={isOwner} />}
          {activeTab === 'stats' && <StatsTab userId={displayUser.id} />}
        </motion.div>
      </AnimatePresence>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        profileData={profileData}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
