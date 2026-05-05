import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Upload,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Eye,
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Download,
  AlertTriangle,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  TrendingDown,
  Clock,
  Wrench,
  Sparkles,
  FileUp,
  Keyboard,
  Wand2,
  ChevronDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { bounties as seedBounties } from '../data/bounties';
import { users as seedUsers } from '../data/users';
import { interactions as seedInteractions } from '../data/interactions';
import { expansions as seedExpansions } from '../data/expansions';
import type { Bounty, Prompt, WordEffect } from '../data/bounties';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type AdminTab = 'dashboard' | 'upload' | 'bounties' | 'analytics' | 'settings';
type UploadMethod = 'document' | 'manual' | 'wizard';
type WizardStep = 1 | 2 | 3 | 4 | 5;

interface AdminSettings {
  siteTitle: string;
  tagline: string;
  darkModeDefault: boolean;
  maintenanceMode: boolean;
}

interface AdminSession {
  username: string;
  token: string;
  expiresAt: number;
}

interface ActivityEvent {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  icon: string;
}

interface Stats {
  totalBounties: number;
  totalUsers: number;
  totalExpansions: number;
  totalComments: number;
  totalLikes: number;
  totalViews: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const LS_ADMIN_KEY = 'adminSession';
const LS_SETTINGS_KEY = 'prompt-forge-admin';
const LS_BOUNTIES_KEY = 'prompt-forge-v1-bounties';

function loadAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(LS_ADMIN_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AdminSession;
    if (Date.now() > s.expiresAt) {
      localStorage.removeItem(LS_ADMIN_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function saveAdminSession(session: AdminSession) {
  localStorage.setItem(LS_ADMIN_KEY, JSON.stringify(session));
}

function clearAdminSession() {
  localStorage.removeItem(LS_ADMIN_KEY);
}

function loadAdminSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as AdminSettings;
  } catch { /* ignore */ }
  return {
    siteTitle: 'Prompt Forge',
    tagline: 'A digital garden of AI ideas.',
    darkModeDefault: false,
    maintenanceMode: false,
  };
}

function saveAdminSettings(s: AdminSettings) {
  localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(s));
}

function loadLocalBounties(): Bounty[] {
  try {
    const raw = localStorage.getItem(LS_BOUNTIES_KEY);
    if (raw) return JSON.parse(raw) as Bounty[];
  } catch { /* ignore */ }
  return [...seedBounties];
}

function saveLocalBounties(b: Bounty[]) {
  localStorage.setItem(LS_BOUNTIES_KEY, JSON.stringify(b));
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function useCountUp(target: number, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const toRef = useRef(target);

  useEffect(() => {
    toRef.current = target;
    fromRef.current = 0;
    startRef.current = null;
    let raf: number;

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts + delay;
      const elapsed = ts - startRef.current;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(fromRef.current + (toRef.current - fromRef.current) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);

  return value;
}

function generateDailyData(days: number) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: Math.floor(Math.random() * 200) + 50,
      users: Math.floor(Math.random() * 15) + 1,
      expansions: Math.floor(Math.random() * 5),
      likes: Math.floor(Math.random() * 40) + 5,
      comments: Math.floor(Math.random() * 12) + 1,
    });
  }
  return data;
}

const ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: '1', user: 'greenThumb', action: 'liked', target: 'Free Stuff Scraper Agent', time: '2 min ago', icon: 'heart' },
  { id: '2', user: 'xsytrance', action: 'published', target: 'Bounty Board', time: '1 hour ago', icon: 'sparkles' },
  { id: '3', user: 'promptWizard', action: 'commented on', target: 'Study MCP', time: '3 hours ago', icon: 'message' },
  { id: '4', user: 'aiGardener', action: 'expanded', target: 'Agent Schedule', time: '5 hours ago', icon: 'link' },
  { id: '5', user: 'forgeMaster', action: 'completed', target: 'Agentify Popular Apps', time: '1 day ago', icon: 'check' },
  { id: '6', user: 'greenThumb', action: 'bookmarked', target: 'Video Generator', time: '1 day ago', icon: 'bookmark' },
  { id: '7', user: 'promptWizard', action: 'liked', target: 'Hermes GPT Clone', time: '2 days ago', icon: 'heart' },
  { id: '8', user: 'aiGardener', action: 'commented on', target: 'Atlas for Agents', time: '2 days ago', icon: 'message' },
];

const EMOJI_OPTIONS = [
  '🤖', '📱', '⚡', '🎬', '🎨', '🔌', '🗺️', '⏰', '🔄', '💬', '🎯', '📢',
  '📊', '🔒', '🌐', '📚', '🧠', '🚀', '🔧', '📝', '🎮', '🏗️', '🔍', '💡',
];

/* ------------------------------------------------------------------ */
/*  Login Screen                                                      */
/* ------------------------------------------------------------------ */

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username !== 'xsytrance' || password !== 'Cipriano0503!!') {
      setError('Invalid credentials');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const session: AdminSession = {
        username: 'xsytrance',
        token: 'mock-jwt-' + Math.random().toString(36).slice(2),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      saveAdminSession(session);
      setLoading(false);
      onLogin();
    }, 600);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0f1a0f] relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, #6b9b6b 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-[#1a2e1a] border border-[#2d4a2d] rounded-modal p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-moss-800 mb-4">
              <Sparkles className="w-7 h-7 text-amber-300" />
            </div>
            <h1 className="font-playfair text-2xl font-bold text-[#f7f3e9]">Prompt Forge</h1>
            <p className="text-moss-400 text-sm mt-1">Admin Panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#a8a29e] mb-1.5 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-button bg-[#2d4a2d] border border-[#3d5a3d] text-[#e8e4dc] placeholder-[#78716c] focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500 transition-colors"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#a8a29e] mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-button bg-[#2d4a2d] border border-[#3d5a3d] text-[#e8e4dc] placeholder-[#78716c] focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500 transition-colors"
                placeholder="Enter password"
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-sm flex items-center gap-1.5"
              >
                <AlertTriangle size={14} /> {error}
              </motion.p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-button bg-moss-700 text-[#f7f3e9] font-medium hover:bg-moss-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CountUp Stat Card                                                 */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  trend: string;
  trendUp: boolean;
  delay: number;
}) {
  const count = useCountUp(value, 1000, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      className="bg-[#f5f5f4] rounded-card p-6 shadow-sm border border-[#e7e5e4]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-moss-100">
          <Icon size={20} className="text-moss-700" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
          {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend}
        </div>
      </div>
      <div className="text-3xl font-bold text-[#1a2e1a] font-playfair">{formatNumber(count)}</div>
      <div className="text-xs text-[#78716c] mt-1 font-medium uppercase tracking-wider">{label}</div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Tab                                                     */
/* ------------------------------------------------------------------ */

function DashboardTab({
  stats,
  onSwitchTab,
}: {
  stats: Stats;
  onSwitchTab: (t: AdminTab) => void;
}) {
  const activityData = generateDailyData(30);

  const quickActions = [
    { label: 'Upload New Bounties', icon: Upload, tab: 'upload' as AdminTab, primary: true },
    { label: 'Create Bounty Manually', icon: FileText, tab: 'upload' as AdminTab, primary: false },
    { label: 'View Full Analytics', icon: BarChart3, tab: 'analytics' as AdminTab, primary: false },
  ];

  const recentEvents = ACTIVITY_EVENTS.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Bounties" value={stats.totalBounties} trend="12%" trendUp delay={0} />
        <StatCard icon={Eye} label="Total Views" value={stats.totalViews} trend="34%" trendUp delay={150} />
        <StatCard icon={Heart} label="Total Likes" value={stats.totalLikes} trend="8%" trendUp delay={300} />
        <StatCard icon={LayoutDashboard} label="Registered Users" value={stats.totalUsers} trend="100%" trendUp delay={450} />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-wrap gap-3"
      >
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => onSwitchTab(action.tab)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-button font-medium text-sm transition-all duration-200 ${
              action.primary
                ? 'bg-moss-700 text-[#f7f3e9] hover:bg-moss-600 shadow-md'
                : 'bg-transparent border-2 border-[#d6d3d1] text-[#44403c] hover:border-moss-500 hover:text-moss-700'
            }`}
          >
            <action.icon size={16} />
            {action.label}
          </button>
        ))}
      </motion.div>

      {/* Activity Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2 bg-[#f5f5f4] rounded-card p-6 shadow-sm border border-[#e7e5e4]"
        >
          <h3 className="font-playfair text-lg font-semibold text-[#1a2e1a] mb-4">Activity (Last 30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b9b6b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b9b6b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#78716c" />
                <YAxis tick={{ fontSize: 11 }} stroke="#78716c" />
                <Tooltip
                  contentStyle={{ background: '#1a2e1a', border: '1px solid #2d4a2d', borderRadius: '8px', color: '#e8e4dc' }}
                />
                <Area type="monotone" dataKey="views" stroke="#6b9b6b" strokeWidth={2} fill="url(#viewsGrad)" name="Views" />
                <Area type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} fill="url(#usersGrad)" name="New Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-[#f5f5f4] rounded-card p-6 shadow-sm border border-[#e7e5e4]"
        >
          <h3 className="font-playfair text-lg font-semibold text-[#1a2e1a] mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentEvents.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.06, duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-moss-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {ev.icon === 'heart' && <Heart size={12} className="text-moss-700" />}
                  {ev.icon === 'sparkles' && <Sparkles size={12} className="text-amber-500" />}
                  {ev.icon === 'message' && <MessageCircle size={12} className="text-moss-700" />}
                  {ev.icon === 'link' && <LinkIcon size={12} className="text-moss-700" />}
                  {ev.icon === 'check' && <Check size={12} className="text-green-600" />}
                  {ev.icon === 'bookmark' && <FileText size={12} className="text-moss-700" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#44403c] leading-snug">
                    <span className="font-medium text-[#1a2e1a]">{ev.user}</span>{' '}
                    <span className="text-[#78716c]">{ev.action}</span>{' '}
                    <span className="font-medium text-[#1a2e1a]">{ev.target}</span>
                  </p>
                  <p className="text-xs text-[#78716c] mt-0.5">{ev.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Popular Bounties */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-[#f5f5f4] rounded-card p-6 shadow-sm border border-[#e7e5e4]"
      >
        <h3 className="font-playfair text-lg font-semibold text-[#1a2e1a] mb-4">Popular Bounties</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e7e5e4]">
                <th className="text-left py-2 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Bounty</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Views</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Likes</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Comments</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {seedBounties
                .slice()
                .sort((a, b) => b.views - a.views)
                .slice(0, 6)
                .map((b) => (
                  <tr key={b.id} className="border-b border-[#e7e5e4]/50 hover:bg-[#efe8d8]/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{b.emoji}</span>
                        <span className="font-medium text-[#1a2e1a]">{b.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#44403c]">{b.views}</td>
                    <td className="py-3 px-3 text-[#44403c]">{b.likes}</td>
                    <td className="py-3 px-3 text-[#44403c]">{b.comments.length}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-medium bg-green-100 text-green-700">
                        Published
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Wizard Step 1: Title / Emoji / Description                        */
/* ------------------------------------------------------------------ */

function WizardStep1({
  title,
  setTitle,
  emoji,
  setEmoji,
  description,
  setDescription,
}: {
  title: string;
  setTitle: (v: string) => void;
  emoji: string;
  setEmoji: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-2">Bounty Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's the core idea?"
          className="w-full px-4 py-2.5 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] text-[#1c1917] focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-2">Emoji</label>
        <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-button text-xl flex items-center justify-center transition-all ${
                emoji === e ? 'bg-moss-100 border-2 border-moss-500 scale-110' : 'bg-[#f5f5f4] border border-[#e7e5e4] hover:border-moss-300'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the bounty in a few sentences..."
          rows={4}
          className="w-full px-4 py-2.5 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] text-[#1c1917] focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500 transition-colors resize-none"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wizard Step 2: Difficulty / Tags / Time / Tools                    */
/* ------------------------------------------------------------------ */

function WizardStep2({
  difficulty,
  setDifficulty,
  tags,
  setTags,
  estimatedTime,
  setEstimatedTime,
  tools,
  setTools,
}: {
  difficulty: string;
  setDifficulty: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  estimatedTime: string;
  setEstimatedTime: (v: string) => void;
  tools: string[];
  setTools: (v: string[]) => void;
}) {
  const [tagInput, setTagInput] = useState('');
  const [toolInput, setToolInput] = useState('');

  const diffOptions = [
    { value: 'easy', label: 'Beginner', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'medium', label: 'Intermediate', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'hard', label: 'Advanced', color: 'bg-red-100 text-red-700 border-red-200' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-2">Difficulty</label>
        <div className="grid grid-cols-3 gap-3">
          {diffOptions.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`px-4 py-3 rounded-button border-2 font-medium text-sm transition-all ${
                difficulty === d.value ? `${d.color} ring-2 ring-moss-500 ring-offset-1` : 'bg-[#f5f5f4] border-[#e7e5e4] text-[#78716c] hover:border-moss-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-moss-100 text-moss-700 text-xs font-medium">
              {t}
              <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-red-500">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              const t = tagInput.trim().replace(/,$/, '');
              if (t && !tags.includes(t)) setTags([...tags, t]);
              setTagInput('');
            }
          }}
          placeholder="Type a tag and press Enter"
          className="w-full px-4 py-2.5 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] text-[#1c1917] focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-2">Estimated Time</label>
        <input
          type="text"
          value={estimatedTime}
          onChange={(e) => setEstimatedTime(e.target.value)}
          placeholder="e.g. 2-3 days"
          className="w-full px-4 py-2.5 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] text-[#1c1917] focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-2">Tools Needed</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tools.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-stone-200 text-stone-700 text-xs font-medium">
              <Wrench size={10} />
              {t}
              <button onClick={() => setTools(tools.filter((x) => x !== t))} className="hover:text-red-500">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={toolInput}
          onChange={(e) => setToolInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              const t = toolInput.trim().replace(/,$/, '');
              if (t && !tools.includes(t)) setTools([...tools, t]);
              setToolInput('');
            }
          }}
          placeholder="Type a tool and press Enter"
          className="w-full px-4 py-2.5 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] text-[#1c1917] focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500 transition-colors"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wizard Step 3: Prompts + Word Effects                             */
/* ------------------------------------------------------------------ */

function WizardStep3({
  prompts,
  setPrompts,
  wordEffects,
  setWordEffects,
}: {
  prompts: Prompt[];
  setPrompts: (v: Prompt[]) => void;
  wordEffects: WordEffect[];
  setWordEffects: (v: WordEffect[]) => void;
}) {
  const levels: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];
  const [activeLevel, setActiveLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const updatePrompt = (level: Prompt['level'], text: string) => {
    setPrompts(
      prompts.map((p) => (p.level === level ? { ...p, text } : p)).concat(
        prompts.some((p) => p.level === level) ? [] : [{ level, text }]
      )
    );
  };

  const currentPrompt = prompts.find((p) => p.level === activeLevel)?.text || '';

  const [newWord, setNewWord] = useState('');
  const [newExplanation, setNewExplanation] = useState('');
  const [newAlternative, setNewAlternative] = useState('');

  const addWordEffect = () => {
    if (newWord.trim() && newExplanation.trim()) {
      setWordEffects([
        ...wordEffects,
        { word: newWord.trim(), explanation: newExplanation.trim(), alternative: newAlternative.trim() || '—' },
      ]);
      setNewWord('');
      setNewExplanation('');
      setNewAlternative('');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-2">Prompt Variations</label>
        <div className="flex gap-2 mb-3">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={`px-3 py-1.5 rounded-button text-xs font-medium capitalize transition-all ${
                activeLevel === lvl
                  ? 'bg-moss-700 text-[#f7f3e9]'
                  : 'bg-[#f5f5f4] text-[#78716c] hover:bg-moss-50'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <textarea
          value={currentPrompt}
          onChange={(e) => updatePrompt(activeLevel, e.target.value)}
          placeholder={`Write the ${activeLevel} prompt...`}
          rows={6}
          className="w-full px-4 py-2.5 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] text-[#1c1917] focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500 transition-colors resize-none font-jetbrains text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-2">Word Effects</label>
        <div className="space-y-2 mb-3">
          {wordEffects.map((we, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-button bg-[#f5f5f4] border border-[#e7e5e4]">
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[#1a2e1a]">{we.word}</span>
                <p className="text-xs text-[#78716c] mt-0.5">{we.explanation}</p>
                <p className="text-xs text-moss-600 mt-0.5">Alt: {we.alternative}</p>
              </div>
              <button onClick={() => setWordEffects(wordEffects.filter((_, idx) => idx !== i))} className="text-[#78716c] hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Word"
            className="px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] text-sm focus:outline-none focus:border-moss-500"
          />
          <input
            value={newExplanation}
            onChange={(e) => setNewExplanation(e.target.value)}
            placeholder="Explanation"
            className="px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] text-sm focus:outline-none focus:border-moss-500"
          />
          <div className="flex gap-2">
            <input
              value={newAlternative}
              onChange={(e) => setNewAlternative(e.target.value)}
              placeholder="Alternative"
              className="flex-1 px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] text-sm focus:outline-none focus:border-moss-500"
            />
            <button onClick={addWordEffect} className="px-3 py-2 rounded-button bg-moss-700 text-white hover:bg-moss-600">
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wizard Step 4: Preview                                            */
/* ------------------------------------------------------------------ */

function WizardStep4({
  title,
  emoji,
  description,
  difficulty,
  tags,
  estimatedTime,
  tools,
  prompts,
  wordEffects,
}: {
  title: string;
  emoji: string;
  description: string;
  difficulty: string;
  tags: string[];
  estimatedTime: string;
  tools: string[];
  prompts: Prompt[];
  wordEffects: WordEffect[];
}) {
  const diffLabel = { easy: 'Beginner', medium: 'Intermediate', hard: 'Advanced' }[difficulty] || difficulty;
  const diffColor = { easy: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', hard: 'bg-red-100 text-red-700' }[difficulty] || 'bg-stone-100 text-stone-700';

  return (
    <div className="space-y-5">
      <div className="bg-[#f5f5f4] rounded-card p-6 border border-[#e7e5e4]">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{emoji || '📋'}</span>
          <div>
            <h3 className="font-playfair text-xl font-bold text-[#1a2e1a]">{title || 'Untitled Bounty'}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-pill text-xs font-medium ${diffColor}`}>{diffLabel}</span>
              {tags.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-pill bg-moss-100 text-moss-700 text-xs font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-[#44403c] leading-relaxed mb-3">{description || 'No description provided.'}</p>
        <div className="flex items-center gap-4 text-xs text-[#78716c]">
          <span className="flex items-center gap-1"><Clock size={12} /> {estimatedTime || '—'}</span>
          <span className="flex items-center gap-1"><Wrench size={12} /> {tools.join(', ') || '—'}</span>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-inter text-sm font-semibold text-[#44403c]">Prompts</h4>
        {prompts.length === 0 ? (
          <p className="text-sm text-[#78716c]">No prompts added yet.</p>
        ) : (
          prompts.map((p) => (
            <div key={p.level} className="bg-[#f5f5f4] rounded-button p-4 border-l-3 border-l-moss-400 border border-[#e7e5e4]">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-pill bg-moss-100 text-moss-700 text-xs font-medium capitalize">{p.level}</span>
              </div>
              <p className="text-sm font-jetbrains text-[#1a2e1a] whitespace-pre-wrap">{p.text}</p>
            </div>
          ))
        )}
      </div>

      {wordEffects.length > 0 && (
        <div>
          <h4 className="font-inter text-sm font-semibold text-[#44403c] mb-2">Word Effects</h4>
          <div className="space-y-2">
            {wordEffects.map((we, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-button bg-cream border border-[#e7e5e4]">
                <span className="font-semibold text-[#1a2e1a] text-sm">{we.word}</span>
                <span className="text-sm text-[#44403c]">— {we.explanation}</span>
                <span className="text-xs text-moss-600 ml-auto">Alt: {we.alternative}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Upload Tab                                                        */
/* ------------------------------------------------------------------ */

function UploadTab({
  bounties,
  onBountiesChange,
}: {
  bounties: Bounty[];
  onBountiesChange: (b: Bounty[]) => void;
}) {
  const [method, setMethod] = useState<UploadMethod>('document');
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [extracted, setExtracted] = useState<Partial<Bounty>[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Wizard state
  const [step, setStep] = useState<WizardStep>(1);
  const [wizTitle, setWizTitle] = useState('');
  const [wizEmoji, setWizEmoji] = useState('🤖');
  const [wizDescription, setWizDescription] = useState('');
  const [wizDifficulty, setWizDifficulty] = useState('easy');
  const [wizTags, setWizTags] = useState<string[]>([]);
  const [wizTime, setWizTime] = useState('');
  const [wizTools, setWizTools] = useState<string[]>([]);
  const [wizPrompts, setWizPrompts] = useState<Prompt[]>([]);
  const [wizWordEffects, setWizWordEffects] = useState<WordEffect[]>([]);

  // Manual form state
  const [manualBounty, setManualBounty] = useState<Partial<Bounty>>({
    title: '', emoji: '🤖', description: '', difficulty: 'easy', tags: [], estimatedTime: '', tools: [], prompts: [], wordEffects: [],
  });

  // Bounty list state
  const [listSearch, setListSearch] = useState('');
  const [listFilter, setListFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [editingBounty, setEditingBounty] = useState<Bounty | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setDroppedFiles(files);
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const mock: Partial<Bounty>[] = files.map((f, i) => ({
        title: f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        emoji: EMOJI_OPTIONS[i % EMOJI_OPTIONS.length],
        description: `Extracted content from ${f.name}. This is a mock extraction for demonstration purposes.`,
        difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
        tags: ['auto-extracted', 'document'],
        estimatedTime: '2-3 days',
        tools: ['Auto-detected'],
        prompts: [
          { level: 'beginner', text: 'Basic prompt extracted from document.' },
          { level: 'intermediate', text: 'Intermediate prompt extracted from document.' },
          { level: 'advanced', text: 'Advanced prompt extracted from document.' },
        ],
        wordEffects: [],
      }));
      setExtracted(mock);
    }, 2000);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const publishWizard = (asDraft = false) => {
    const newBounty: Bounty = {
      id: 'b' + Date.now(),
      title: wizTitle,
      emoji: wizEmoji,
      description: wizDescription,
      difficulty: wizDifficulty as 'easy' | 'medium' | 'hard',
      tags: wizTags,
      estimatedTime: wizTime,
      tools: wizTools,
      prompts: wizPrompts,
      wordEffects: wizWordEffects,
      author: 'xsytrance',
      createdAt: new Date().toISOString().split('T')[0],
      views: 0,
      likes: 0,
      comments: [],
      expansions: [],
      status: asDraft ? 'new' : 'new',
    };
    const updated = [...bounties, newBounty];
    onBountiesChange(updated);
    saveLocalBounties(updated);
    // Reset wizard
    setStep(1);
    setWizTitle('');
    setWizDescription('');
    setWizTags([]);
    setWizTime('');
    setWizTools([]);
    setWizPrompts([]);
    setWizWordEffects([]);
    setMethod('document');
  };

  const publishManual = (asDraft = false) => {
    const mb = manualBounty;
    const newBounty: Bounty = {
      id: 'b' + Date.now(),
      title: mb.title || 'Untitled',
      emoji: mb.emoji || '📋',
      description: mb.description || '',
      difficulty: (mb.difficulty as 'easy' | 'medium' | 'hard') || 'easy',
      tags: mb.tags || [],
      estimatedTime: mb.estimatedTime || '',
      tools: mb.tools || [],
      prompts: mb.prompts || [],
      wordEffects: mb.wordEffects || [],
      author: 'xsytrance',
      createdAt: new Date().toISOString().split('T')[0],
      views: 0,
      likes: 0,
      comments: [],
      expansions: [],
      status: asDraft ? 'new' : 'new',
    };
    const updated = [...bounties, newBounty];
    onBountiesChange(updated);
    saveLocalBounties(updated);
    setManualBounty({
      title: '', emoji: '🤖', description: '', difficulty: 'easy', tags: [], estimatedTime: '', tools: [], prompts: [], wordEffects: [],
    });
  };

  const deleteBounty = (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    const updated = bounties.filter((b) => b.id !== id);
    onBountiesChange(updated);
    saveLocalBounties(updated);
  };

  const saveEdit = (edited: Bounty) => {
    const updated = bounties.map((b) => (b.id === edited.id ? edited : b));
    onBountiesChange(updated);
    saveLocalBounties(updated);
    setEditModalOpen(false);
    setEditingBounty(null);
  };

  const filteredBounties = bounties.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(listSearch.toLowerCase()) || b.tags.some((t) => t.toLowerCase().includes(listSearch.toLowerCase()));
    const matchesFilter = listFilter === 'all' || (listFilter === 'published' && b.status === 'new') || (listFilter === 'draft' && b.status === 'inprogress') || (listFilter === 'archived' && b.status === 'completed');
    return matchesSearch && matchesFilter;
  });

  const paginated = filteredBounties.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredBounties.length / pageSize);

  const stepValid = () => {
    switch (step) {
      case 1: return wizTitle.trim().length > 0;
      case 2: return wizDescription.trim().length > 0;
      case 3: return true;
      case 4: return wizPrompts.length > 0;
      case 5: return true;
    }
  };

  const wizardStepLabels = ['Seed', 'Story', 'Classify', 'Forge', 'Review'];

  return (
    <div className="space-y-6">
      {/* Method Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {([
          { key: 'document', label: 'Upload Document', sub: 'PDF, TXT, DOCX, MD', icon: FileUp },
          { key: 'manual', label: 'Type Manually', sub: 'Quick form', icon: Keyboard },
          { key: 'wizard', label: 'Guided Wizard', sub: 'Step-by-step creator', icon: Wand2 },
        ] as { key: UploadMethod; label: string; sub: string; icon: React.ElementType }[]).map((m) => (
          <button
            key={m.key}
            onClick={() => setMethod(m.key)}
            className={`flex items-center gap-4 p-5 rounded-card border-2 transition-all text-left ${
              method === m.key
                ? 'bg-moss-50 border-moss-500 shadow-sm'
                : 'bg-[#f5f5f4] border-[#e7e5e4] hover:border-moss-300'
            }`}
          >
            <div className={`p-3 rounded-button ${method === m.key ? 'bg-moss-100 text-moss-700' : 'bg-[#e7e5e4] text-[#78716c]'}`}>
              <m.icon size={22} />
            </div>
            <div>
              <div className={`font-medium text-sm ${method === m.key ? 'text-moss-900' : 'text-[#44403c]'}`}>{m.label}</div>
              <div className="text-xs text-[#78716c]">{m.sub}</div>
            </div>
            {method === m.key && <Check size={18} className="ml-auto text-moss-600" />}
          </button>
        ))}
      </div>

      {/* Document Upload */}
      {method === 'document' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {!processing && extracted.length === 0 && droppedFiles.length === 0 && (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center min-h-[240px] rounded-card border-2 border-dashed cursor-pointer transition-all ${
                dragOver ? 'border-moss-500 bg-moss-50' : 'border-[#d6d3d1] bg-[#f5f5f4] hover:border-moss-400 hover:bg-moss-50/50'
              }`}
            >
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
                if (e.target.files) {
                  setDroppedFiles(Array.from(e.target.files));
                  setProcessing(true);
                  setTimeout(() => {
                    setProcessing(false);
                    const files = Array.from(e.target.files || []);
                    const mock = files.map((f, i) => ({
                      title: f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                      emoji: EMOJI_OPTIONS[i % EMOJI_OPTIONS.length],
                      description: `Extracted content from ${f.name}.`,
                      difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
                      tags: ['auto-extracted'],
                      estimatedTime: '2-3 days',
                      tools: ['Auto-detected'],
                      prompts: [
                        { level: 'beginner' as const, text: 'Basic prompt from document.' },
                        { level: 'intermediate' as const, text: 'Intermediate prompt from document.' },
                        { level: 'advanced' as const, text: 'Advanced prompt from document.' },
                      ],
                      wordEffects: [],
                    }));
                    setExtracted(mock);
                  }, 2000);
                }
              }} />
              <div className="animate-leaf-drift">
                <FileUp size={40} className="text-moss-400 mb-3" />
              </div>
              <p className="text-[#44403c] font-medium">Drop your file here or click to browse</p>
              <p className="text-xs text-[#78716c] mt-1">Supports PDF, TXT, DOCX, MD, RTF</p>
            </div>
          )}

          {processing && (
            <div className="flex flex-col items-center justify-center min-h-[240px] rounded-card bg-[#f5f5f4] border border-[#e7e5e4]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="mb-4"
              >
                <Sparkles size={36} className="text-moss-500" />
              </motion.div>
              <p className="text-[#44403c] font-medium">Extracting ideas from document...</p>
              <p className="text-xs text-[#78716c] mt-1">This may take a moment</p>
            </div>
          )}

          {extracted.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-playfair text-lg font-semibold text-[#1a2e1a]">Extracted Bounties</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extracted.map((ex, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#f5f5f4] rounded-card p-5 border border-[#e7e5e4]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{ex.emoji}</span>
                      <h5 className="font-semibold text-[#1a2e1a]">{ex.title}</h5>
                    </div>
                    <p className="text-sm text-[#44403c] mb-3">{ex.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {ex.tags?.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-pill bg-moss-100 text-moss-700 text-xs">{t}</span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          const nb: Bounty = {
                            id: 'b' + Date.now() + i,
                            title: ex.title || 'Untitled',
                            emoji: ex.emoji || '📋',
                            description: ex.description || '',
                            difficulty: (ex.difficulty as 'easy' | 'medium' | 'hard') || 'easy',
                            tags: ex.tags || [],
                            estimatedTime: ex.estimatedTime || '',
                            tools: ex.tools || [],
                            prompts: ex.prompts || [],
                            wordEffects: ex.wordEffects || [],
                            author: 'xsytrance',
                            createdAt: new Date().toISOString().split('T')[0],
                            views: 0, likes: 0, comments: [], expansions: [], status: 'new' as const,
                          };
                          const updated = [...bounties, nb];
                          onBountiesChange(updated);
                          saveLocalBounties(updated);
                          setExtracted([]);
                          setDroppedFiles([]);
                        }}
                        className="px-3 py-1.5 rounded-button bg-moss-700 text-[#f7f3e9] text-xs font-medium hover:bg-moss-600"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => {
                          setExtracted(extracted.filter((_, idx) => idx !== i));
                        }}
                        className="px-3 py-1.5 rounded-button border border-[#d6d3d1] text-[#44403c] text-xs font-medium hover:border-red-300 hover:text-red-500"
                      >
                        Discard
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const all = extracted.map((ex, i) => ({
                      id: 'b' + Date.now() + i,
                      title: ex.title || 'Untitled',
                      emoji: ex.emoji || '📋',
                      description: ex.description || '',
                      difficulty: (ex.difficulty as 'easy' | 'medium' | 'hard') || 'easy',
                      tags: ex.tags || [],
                      estimatedTime: ex.estimatedTime || '',
                      tools: ex.tools || [],
                      prompts: ex.prompts || [],
                      wordEffects: ex.wordEffects || [],
                      author: 'xsytrance',
                      createdAt: new Date().toISOString().split('T')[0],
                      views: 0, likes: 0, comments: [], expansions: [], status: 'new' as const,
                    }));
                    const updated = [...bounties, ...all];
                    onBountiesChange(updated);
                    saveLocalBounties(updated);
                    setExtracted([]);
                    setDroppedFiles([]);
                  }}
                  className="px-5 py-2 rounded-button bg-moss-700 text-[#f7f3e9] font-medium hover:bg-moss-600"
                >
                  Publish All
                </button>
                <button
                  onClick={() => { setExtracted([]); setDroppedFiles([]); }}
                  className="px-5 py-2 rounded-button border border-[#d6d3d1] text-[#44403c] font-medium hover:border-moss-500 hover:text-moss-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Manual Form */}
      {method === 'manual' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#44403c] mb-2">Title</label>
                <input
                  type="text"
                  value={manualBounty.title || ''}
                  onChange={(e) => setManualBounty({ ...manualBounty, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#44403c] mb-2">Emoji</label>
                <div className="grid grid-cols-8 gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setManualBounty({ ...manualBounty, emoji: e })}
                      className={`w-9 h-9 rounded-button text-lg flex items-center justify-center transition-all ${
                        manualBounty.emoji === e ? 'bg-moss-100 border-2 border-moss-500' : 'bg-[#f5f5f4] border border-[#e7e5e4] hover:border-moss-300'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#44403c] mb-2">Description</label>
                <textarea
                  value={manualBounty.description || ''}
                  onChange={(e) => setManualBounty({ ...manualBounty, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 focus:ring-1 focus:ring-moss-500 transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#44403c] mb-2">Difficulty</label>
                  <select
                    value={manualBounty.difficulty}
                    onChange={(e) => setManualBounty({ ...manualBounty, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                    className="w-full px-4 py-2.5 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#44403c] mb-2">Estimated Time</label>
                  <input
                    type="text"
                    value={manualBounty.estimatedTime || ''}
                    onChange={(e) => setManualBounty({ ...manualBounty, estimatedTime: e.target.value })}
                    placeholder="e.g. 2-3 days"
                    className="w-full px-4 py-2.5 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => publishManual(false)} className="px-5 py-2.5 rounded-button bg-moss-700 text-[#f7f3e9] font-medium hover:bg-moss-600">
                  Publish Bounty
                </button>
                <button onClick={() => publishManual(true)} className="px-5 py-2.5 rounded-button border border-[#d6d3d1] text-[#44403c] font-medium hover:border-moss-500">
                  Save as Draft
                </button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-[#f5f5f4] rounded-card p-5 border border-[#e7e5e4] h-fit">
              <h4 className="text-xs font-medium text-[#78716c] uppercase tracking-wider mb-3">Live Preview</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{manualBounty.emoji || '📋'}</span>
                <span className="font-playfair font-bold text-[#1a2e1a]">{manualBounty.title || 'Untitled'}</span>
              </div>
              <p className="text-sm text-[#44403c] mb-2">{manualBounty.description || 'No description.'}</p>
              <div className="flex items-center gap-2 text-xs text-[#78716c]">
                <Clock size={12} /> {manualBounty.estimatedTime || '—'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Wizard */}
      {method === 'wizard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {wizardStepLabels.map((lbl, i) => {
              const s = (i + 1) as WizardStep;
              const active = s === step;
              const done = s < step;
              return (
                <div key={lbl} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      active ? 'bg-moss-700 text-[#f7f3e9] ring-2 ring-moss-300' : done ? 'bg-moss-500 text-white' : 'bg-[#e7e5e4] text-[#78716c]'
                    }`}
                  >
                    {done ? <Check size={14} /> : s}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? 'text-moss-900' : done ? 'text-moss-700' : 'text-[#78716c]'}`}>
                    {lbl}
                  </span>
                  {i < wizardStepLabels.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full ${done ? 'bg-moss-500' : 'bg-[#e7e5e4]'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#f5f5f4] rounded-card p-6 border border-[#e7e5e4]"
            >
              {step === 1 && (
                <WizardStep1
                  title={wizTitle} setTitle={setWizTitle}
                  emoji={wizEmoji} setEmoji={setWizEmoji}
                  description={wizDescription} setDescription={setWizDescription}
                />
              )}
              {step === 2 && (
                <WizardStep2
                  difficulty={wizDifficulty} setDifficulty={setWizDifficulty}
                  tags={wizTags} setTags={setWizTags}
                  estimatedTime={wizTime} setEstimatedTime={setWizTime}
                  tools={wizTools} setTools={setWizTools}
                />
              )}
              {step === 3 && (
                <WizardStep3
                  prompts={wizPrompts} setPrompts={setWizPrompts}
                  wordEffects={wizWordEffects} setWordEffects={setWizWordEffects}
                />
              )}
              {step === 4 && (
                <WizardStep4
                  title={wizTitle} emoji={wizEmoji} description={wizDescription}
                  difficulty={wizDifficulty} tags={wizTags} estimatedTime={wizTime}
                  tools={wizTools} prompts={wizPrompts} wordEffects={wizWordEffects}
                />
              )}
              {step === 5 && (
                <div className="space-y-5">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-moss-100 flex items-center justify-center mx-auto mb-4">
                      <Sparkles size={28} className="text-moss-600" />
                    </div>
                    <h3 className="font-playfair text-xl font-bold text-[#1a2e1a]">Ready to Publish!</h3>
                    <p className="text-sm text-[#78716c] mt-1">Review your bounty one last time before publishing.</p>
                  </div>
                  <WizardStep4
                    title={wizTitle} emoji={wizEmoji} description={wizDescription}
                    difficulty={wizDifficulty} tags={wizTags} estimatedTime={wizTime}
                    tools={wizTools} prompts={wizPrompts} wordEffects={wizWordEffects}
                  />
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => publishWizard(false)} className="px-6 py-2.5 rounded-button bg-moss-700 text-[#f7f3e9] font-medium hover:bg-moss-600">
                      Publish Bounty
                    </button>
                    <button onClick={() => publishWizard(true)} className="px-6 py-2.5 rounded-button border border-[#d6d3d1] text-[#44403c] font-medium hover:border-moss-500">
                      Save as Draft
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Wizard Navigation */}
          {step < 5 && (
            <div className="flex justify-between">
              <button
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s))}
                disabled={step === 1}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-button border border-[#d6d3d1] text-[#44403c] text-sm font-medium hover:border-moss-500 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={() => setStep((s) => (s < 5 ? ((s + 1) as WizardStep) : s))}
                disabled={!stepValid()}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-button bg-moss-700 text-[#f7f3e9] text-sm font-medium hover:bg-moss-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Bounty List */}
      <div className="bg-[#f5f5f4] rounded-card p-6 shadow-sm border border-[#e7e5e4]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="font-playfair text-lg font-semibold text-[#1a2e1a]">All Bounties</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716c]" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => { setListSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search bounties..."
                className="w-full sm:w-56 pl-8 pr-3 py-2 rounded-button bg-white border border-[#e7e5e4] text-sm focus:outline-none focus:border-moss-500"
              />
            </div>
            <div className="relative">
              <select
                value={listFilter}
                onChange={(e) => { setListFilter(e.target.value as typeof listFilter); setCurrentPage(1); }}
                className="pl-3 pr-7 py-2 rounded-button bg-white border border-[#e7e5e4] text-sm focus:outline-none focus:border-moss-500 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#78716c] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e7e5e4]">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Title</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Status</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Author</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Date</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Views</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Likes</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-[#78716c] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((b) => (
                <tr key={b.id} className="border-b border-[#e7e5e4]/50 hover:bg-[#efe8d8]/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{b.emoji}</span>
                      <span className="font-medium text-[#1a2e1a] truncate max-w-[200px]">{b.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-xs font-medium ${
                      b.status === 'new' ? 'bg-green-100 text-green-700' : b.status === 'inprogress' ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {b.status === 'new' ? 'Published' : b.status === 'inprogress' ? 'Draft' : 'Archived'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#44403c]">{b.author}</td>
                  <td className="py-3 px-3 text-[#44403c]">{b.createdAt}</td>
                  <td className="py-3 px-3 text-[#44403c]">{b.views}</td>
                  <td className="py-3 px-3 text-[#44403c]">{b.likes}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingBounty(b); setEditModalOpen(true); }}
                        className="p-1.5 rounded-button text-[#78716c] hover:text-moss-700 hover:bg-moss-50 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => deleteBounty(b.id)}
                        className="p-1.5 rounded-button text-[#78716c] hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-[#78716c]">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredBounties.length)} of {filteredBounties.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-button text-[#78716c] hover:text-moss-700 hover:bg-moss-50 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-button text-xs font-medium transition-colors ${
                    currentPage === p ? 'bg-moss-700 text-white' : 'text-[#44403c] hover:bg-moss-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-button text-[#78716c] hover:text-moss-700 hover:bg-moss-50 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModalOpen && editingBounty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#fafaf9] rounded-modal p-6 w-full max-w-2xl max-h-[85dvh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-playfair text-lg font-bold text-[#1a2e1a]">Edit Bounty</h3>
                <button onClick={() => setEditModalOpen(false)} className="p-1.5 rounded-button hover:bg-stone-100 text-[#78716c]">
                  <X size={18} />
                </button>
              </div>
              <EditBountyForm bounty={editingBounty} onSave={saveEdit} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Edit Bounty Form (inline modal)                                   */
/* ------------------------------------------------------------------ */

function EditBountyForm({ bounty, onSave }: { bounty: Bounty; onSave: (b: Bounty) => void }) {
  const [form, setForm] = useState<Bounty>({ ...bounty });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-1">Emoji</label>
        <input
          type="text"
          value={form.emoji}
          onChange={(e) => setForm({ ...form, emoji: e.target.value })}
          className="w-full px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#44403c] mb-1">Difficulty</label>
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
            className="w-full px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#44403c] mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'new' | 'inprogress' | 'completed' })}
            className="w-full px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm"
          >
            <option value="new">New</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={form.tags.join(', ')}
          onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
          className="w-full px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#44403c] mb-1">Estimated Time</label>
          <input
            type="text"
            value={form.estimatedTime}
            onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
            className="w-full px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#44403c] mb-1">Views</label>
          <input
            type="number"
            value={form.views}
            onChange={(e) => setForm({ ...form, views: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#44403c] mb-1">Tools (comma-separated)</label>
        <input
          type="text"
          value={form.tools.join(', ')}
          onChange={(e) => setForm({ ...form, tools: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
          className="w-full px-3 py-2 rounded-button bg-[#f5f5f4] border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(form)}
          className="px-5 py-2 rounded-button bg-moss-700 text-[#f7f3e9] font-medium text-sm hover:bg-moss-600"
        >
          <Save size={14} className="inline mr-1" /> Save Changes
        </button>
        <button
          onClick={() => onSave({ ...form })}
          className="px-5 py-2 rounded-button border border-[#d6d3d1] text-[#44403c] font-medium text-sm hover:border-moss-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Analytics Tab                                                   */
/* ------------------------------------------------------------------ */

function AnalyticsTab() {
  const [dateRange, setDateRange] = useState<'7' | '30' | 'all'>('30');
  const days = dateRange === '7' ? 7 : dateRange === '30' ? 30 : 60;
  const trafficData = generateDailyData(days);

  const engagementData = [
    { name: 'Likes', value: seedInteractions.filter((i) => i.type === 'like').length, color: '#6b9b6b' },
    { name: 'Bookmarks', value: seedInteractions.filter((i) => i.type === 'bookmark').length, color: '#f59e0b' },
    { name: 'Completions', value: seedInteractions.filter((i) => i.type === 'complete').length, color: '#22c55e' },
  ];

  const tagData = [
    { tag: 'automation', count: 5 },
    { tag: 'AI-generation', count: 4 },
    { tag: 'API', count: 4 },
    { tag: 'scraping', count: 3 },
    { tag: 'LLM', count: 3 },
    { tag: 'social-media', count: 3 },
    { tag: 'video', count: 2 },
    { tag: 'design', count: 2 },
  ];

  const userGrowthData = [
    { month: 'Jan', users: 2 },
    { month: 'Feb', users: 7 },
    { month: 'Mar', users: 12 },
    { month: 'Apr', users: 15 },
    { month: 'May', users: 18 },
    { month: 'Jun', users: 23 },
  ];

  const deviceData = [
    { name: 'Desktop', value: 58, color: '#6b9b6b' },
    { name: 'Mobile', value: 32, color: '#a8d4a8' },
    { name: 'Tablet', value: 10, color: '#f59e0b' },
  ];

  const funnelData = [
    { stage: 'Views', value: 2847 },
    { stage: 'Likes', value: 456 },
    { stage: 'Comments', value: 89 },
    { stage: 'Completions', value: 34 },
  ];

  const totalInteractions = engagementData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="flex items-center gap-2">
        {(['7', '30', 'all'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setDateRange(r)}
            className={`px-3 py-1.5 rounded-button text-xs font-medium transition-colors ${
              dateRange === r ? 'bg-moss-700 text-[#f7f3e9]' : 'bg-[#f5f5f4] text-[#44403c] hover:bg-moss-50'
            }`}
          >
            {r === 'all' ? 'All Time' : `Last ${r} Days`}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#f5f5f4] rounded-card p-5 border border-[#e7e5e4] shadow-sm">
          <h4 className="font-playfair text-base font-semibold text-[#1a2e1a] mb-3">Traffic (Daily Unique Visitors)</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b9b6b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6b9b6b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#78716c" />
                <YAxis tick={{ fontSize: 10 }} stroke="#78716c" />
                <Tooltip contentStyle={{ background: '#1a2e1a', border: '1px solid #2d4a2d', borderRadius: '8px', color: '#e8e4dc' }} />
                <Area type="monotone" dataKey="views" stroke="#6b9b6b" strokeWidth={2} fill="url(#trafficGrad)" name="Visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#f5f5f4] rounded-card p-5 border border-[#e7e5e4] shadow-sm">
          <h4 className="font-playfair text-base font-semibold text-[#1a2e1a] mb-3">Engagement Breakdown</h4>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a2e1a', border: '1px solid #2d4a2d', borderRadius: '8px', color: '#e8e4dc' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none">
              <div className="text-2xl font-bold text-[#1a2e1a] font-playfair">{totalInteractions}</div>
              <div className="text-xs text-[#78716c]">Total</div>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {engagementData.map((e) => (
              <div key={e.name} className="flex items-center gap-1.5 text-xs text-[#44403c]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                {e.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#f5f5f4] rounded-card p-5 border border-[#e7e5e4] shadow-sm">
          <h4 className="font-playfair text-base font-semibold text-[#1a2e1a] mb-3">Popular Tags</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tagData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#78716c" />
                <YAxis dataKey="tag" type="category" tick={{ fontSize: 10 }} stroke="#78716c" width={80} />
                <Tooltip contentStyle={{ background: '#1a2e1a', border: '1px solid #2d4a2d', borderRadius: '8px', color: '#e8e4dc' }} />
                <Bar dataKey="count" fill="#6b9b6b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#f5f5f4] rounded-card p-5 border border-[#e7e5e4] shadow-sm">
          <h4 className="font-playfair text-base font-semibold text-[#1a2e1a] mb-3">User Growth</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#78716c" />
                <YAxis tick={{ fontSize: 10 }} stroke="#78716c" />
                <Tooltip contentStyle={{ background: '#1a2e1a', border: '1px solid #2d4a2d', borderRadius: '8px', color: '#e8e4dc' }} />
                <Line type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#f5f5f4] rounded-card p-5 border border-[#e7e5e4] shadow-sm">
          <h4 className="font-playfair text-base font-semibold text-[#1a2e1a] mb-3">Device Breakdown</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" outerRadius={70} dataKey="value" stroke="none">
                  {deviceData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a2e1a', border: '1px solid #2d4a2d', borderRadius: '8px', color: '#e8e4dc' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {deviceData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {d.name === 'Desktop' && <Monitor size={14} className="text-moss-600" />}
                  {d.name === 'Mobile' && <Smartphone size={14} className="text-moss-400" />}
                  {d.name === 'Tablet' && <Tablet size={14} className="text-amber-500" />}
                  <span className="text-[#44403c]">{d.name}</span>
                </div>
                <span className="font-medium text-[#1a2e1a]">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel + Top Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#f5f5f4] rounded-card p-5 border border-[#e7e5e4] shadow-sm">
          <h4 className="font-playfair text-base font-semibold text-[#1a2e1a] mb-3">Bounty Completion Funnel</h4>
          <div className="space-y-3">
            {funnelData.map((f, i) => {
              const max = funnelData[0].value;
              const pct = (f.value / max) * 100;
              return (
                <div key={f.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#44403c] font-medium">{f.stage}</span>
                    <span className="text-[#78716c]">{f.value.toLocaleString()}</span>
                  </div>
                  <div className="h-6 bg-[#e7e5e4] rounded-button overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.15, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                      className={`h-full rounded-button flex items-center justify-end pr-2 text-[10px] font-medium text-white ${
                        i === 0 ? 'bg-moss-500' : i === 1 ? 'bg-moss-600' : i === 2 ? 'bg-moss-700' : 'bg-moss-800'
                      }`}
                    >
                      {Math.round(pct)}%
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#f5f5f4] rounded-card p-5 border border-[#e7e5e4] shadow-sm">
          <h4 className="font-playfair text-base font-semibold text-[#1a2e1a] mb-3">Top Contributors</h4>
          <div className="space-y-3">
            {seedUsers.slice(1).map((u, i) => {
              const userInteractions = seedInteractions.filter((x) => x.userId === u.id).length;
              const maxInteractions = 5;
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full bg-stone-200" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#1a2e1a]">{u.username}</span>
                      <span className="text-xs text-[#78716c]">{userInteractions} actions</span>
                    </div>
                    <div className="h-2 bg-[#e7e5e4] rounded-full mt-1 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(userInteractions / maxInteractions) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="h-full bg-moss-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings Tab                                                      */
/* ------------------------------------------------------------------ */

function SettingsTab() {
  const [settings, setSettings] = useState<AdminSettings>(loadAdminSettings);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const update = (patch: Partial<AdminSettings>) => {
    const s = { ...settings, ...patch };
    setSettings(s);
    saveAdminSettings(s);
  };

  const exportData = () => {
    const data = {
      bounties: loadLocalBounties(),
      users: seedUsers,
      interactions: seedInteractions,
      expansions: seedExpansions,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-forge-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirmText !== 'DELETE') return;
    localStorage.clear();
    setConfirmClear(false);
    setConfirmText('');
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Site Config */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#f5f5f4] rounded-card p-6 border border-[#e7e5e4] shadow-sm"
      >
        <h3 className="font-playfair text-lg font-semibold text-[#1a2e1a] mb-4">Site Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#44403c] mb-1">Site Title</label>
            <input
              type="text"
              value={settings.siteTitle}
              onChange={(e) => update({ siteTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-button bg-white border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#44403c] mb-1">Tagline</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => update({ tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-button bg-white border border-[#e7e5e4] focus:outline-none focus:border-moss-500 text-sm"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-[#44403c]">Dark Mode Default</p>
              <p className="text-xs text-[#78716c]">Set dark mode as the default theme</p>
            </div>
            <button
              onClick={() => update({ darkModeDefault: !settings.darkModeDefault })}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.darkModeDefault ? 'bg-moss-700' : 'bg-[#d6d3d1]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.darkModeDefault ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-[#44403c]">Maintenance Mode</p>
              <p className="text-xs text-[#78716c]">Show maintenance page to visitors</p>
            </div>
            <button
              onClick={() => update({ maintenanceMode: !settings.maintenanceMode })}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.maintenanceMode ? 'bg-amber-500' : 'bg-[#d6d3d1]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Export */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-[#f5f5f4] rounded-card p-6 border border-[#e7e5e4] shadow-sm"
      >
        <h3 className="font-playfair text-lg font-semibold text-[#1a2e1a] mb-4">Export Data</h3>
        <p className="text-sm text-[#78716c] mb-4">Download all platform data as a JSON backup file.</p>
        <button
          onClick={exportData}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-moss-700 text-[#f7f3e9] font-medium text-sm hover:bg-moss-600"
        >
          <Download size={16} /> Export All Data as JSON
        </button>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-red-50 rounded-card p-6 border border-red-200 shadow-sm"
      >
        <h3 className="font-playfair text-lg font-semibold text-red-800 mb-4">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">Clearing data will permanently remove all bounties, users, and settings from local storage. This action cannot be undone.</p>
        <button
          onClick={() => setConfirmClear(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border-2 border-red-300 text-red-700 font-medium text-sm hover:bg-red-100"
        >
          <Trash2 size={16} /> Clear All Data
        </button>
      </motion.div>

      {/* Confirm Clear Modal */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40"
            onClick={() => setConfirmClear(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-modal p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-red-100">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <h3 className="font-playfair text-lg font-bold text-red-800">Confirm Data Clear</h3>
              </div>
              <p className="text-sm text-[#44403c] mb-4">
                This will permanently delete all localStorage data. Type <span className="font-mono font-bold text-red-700">DELETE</span> to confirm.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 rounded-button border border-red-200 focus:outline-none focus:border-red-500 text-sm mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={clearAll}
                  disabled={confirmText !== 'DELETE'}
                  className="px-4 py-2 rounded-button bg-red-600 text-white font-medium text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear All Data
                </button>
                <button
                  onClick={() => { setConfirmClear(false); setConfirmText(''); }}
                  className="px-4 py-2 rounded-button border border-[#d6d3d1] text-[#44403c] font-medium text-sm hover:bg-stone-100"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  Main Admin Page                                                   */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bounties, setBounties] = useState<Bounty[]>([]);

  useEffect(() => {
    const s = loadAdminSession();
    setSession(s);
    setChecking(false);
    setBounties(loadLocalBounties());
  }, []);

  const handleLogin = () => {
    setSession(loadAdminSession());
  };

  const handleLogout = () => {
    clearAdminSession();
    setSession(null);
  };

  if (checking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0f1a0f]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={32} className="text-moss-500" />
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const stats: Stats = {
    totalBounties: bounties.length,
    totalUsers: seedUsers.length,
    totalExpansions: seedExpansions.length,
    totalComments: bounties.reduce((a, b) => a + b.comments.length, 0),
    totalLikes: bounties.reduce((a, b) => a + b.likes, 0),
    totalViews: bounties.reduce((a, b) => a + b.views, 0),
  };

  const navItems: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'bounties', label: 'Bounties', icon: FileText },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const tabLabels: Record<AdminTab, string> = {
    dashboard: 'Dashboard',
    upload: 'Upload',
    bounties: 'Bounties',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#fafaf9]">
      {/* Admin Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-moss-900 border-b border-[#2d4a2d] flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-button text-[#a8a29e] hover:text-[#f7f3e9] hover:bg-[#2d4a2d]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h1 className="font-playfair text-base font-bold text-[#f7f3e9]">🌿 Prompt Forge — Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-moss-400">{tabLabels[activeTab]}</span>
          <div className="h-5 w-px bg-[#2d4a2d] hidden sm:block" />
          <span className="text-sm text-[#a8a29e]">{session.username}</span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-button text-[#a8a29e] hover:text-[#f7f3e9] hover:bg-[#2d4a2d] transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static top-14 bottom-0 z-40 w-60 bg-moss-900 border-r border-[#2d4a2d] flex-shrink-0 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 space-y-1">
            {navItems.map((item, i) => (
              <motion.button
                key={item.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-all ${
                  activeTab === item.key
                    ? 'bg-[#2d4a2d] text-[#f7f3e9] border-l-[3px] border-amber-500'
                    : 'text-[#f7f3e9]/80 hover:bg-[#2d4a2d] hover:text-[#f7f3e9]'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </motion.button>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2d4a2d]">
            <p className="text-xs text-moss-400">Prompt Forge Admin v1.0</p>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-4 lg:p-6 xl:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <DashboardTab stats={stats} onSwitchTab={setActiveTab} />}
                {activeTab === 'upload' && <UploadTab bounties={bounties} onBountiesChange={setBounties} />}
                {activeTab === 'bounties' && <UploadTab bounties={bounties} onBountiesChange={setBounties} />}
                {activeTab === 'analytics' && <AnalyticsTab />}
                {activeTab === 'settings' && <SettingsTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
