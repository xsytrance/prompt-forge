import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Heart, MessageCircle, Link2, Clock, Wrench, ChevronDown } from 'lucide-react';
import { bounties as allBounties } from '../data/bounties';
import { expansions } from '../data/expansions';
import { users } from '../data/users';
import type { Bounty, Difficulty } from '../data/bounties';

/* ─────────────── Typing Hook ─────────────── */
function useTyping(text: string, speed = 60, delay = 500) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, speed, delay]);
  return { displayed, done };
}

/* ─────────────── CountUp Hook ─────────────── */
function useCountUp(end: number, duration = 1500, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  useEffect(() => {
    if (!startOnView || !inView) return;
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
  }, [inView, end, duration, startOnView]);
  return { count, ref };
}

/* ─────────────── Difficulty Badge ─────────────── */
function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = {
    easy: { emoji: '🌱', label: 'Beginner', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-[#22c55e]' },
    medium: { emoji: '🌿', label: 'Intermediate', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    hard: { emoji: '🌳', label: 'Advanced', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  }[difficulty];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[9999px] text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.emoji} {config.label}
    </span>
  );
}

/* ─────────────── Bounty Card ─────────────── */
function BountyCard({ bounty, index }: { bounty: Bounty; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link to={`/bounty/${bounty.id}`} className="block h-full">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="h-full bg-stone-100 border border-stone-200 rounded-card p-6 flex flex-col gap-4 transition-shadow duration-200 ease-spring hover:shadow-lg hover:border-moss-300"
          style={{ transformStyle: 'preserve-3d', transition: 'transform 0.2s ease-spring, box-shadow 0.2s ease-spring, border-color 0.2s' }}
        >
          <div className="flex items-start justify-between">
            <DifficultyBadge difficulty={bounty.difficulty} />
            <span className="text-2xl">{bounty.emoji}</span>
          </div>
          <h3 className="font-inter text-lg font-bold text-moss-900 leading-snug line-clamp-2">
            {bounty.title}
          </h3>
          <p className="text-sm text-stone-500 leading-relaxed line-clamp-3 flex-1">
            {bounty.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {bounty.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-[9999px] bg-moss-100 text-moss-700 text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs text-stone-500">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Clock size={13} /> {bounty.estimatedTime}
              </span>
              <span className="inline-flex items-center gap-1">
                <Wrench size={13} /> {bounty.tools.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Heart size={13} /> {bounty.likes}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={13} /> {bounty.comments.length}
              </span>
              <span className="inline-flex items-center gap-1">
                <Link2 size={13} /> {bounty.expansions.length}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────────── Filter Pills ─────────────── */
const filters: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Beginner 🌱', value: 'easy' },
  { label: 'Intermediate 🌿', value: 'medium' },
  { label: 'Advanced 🌳', value: 'hard' },
  { label: 'Trending 🔥', value: 'trending' },
];

/* ─────────────── Hero Section ─────────────── */
function HeroSection({ onSearch }: { onSearch: (q: string) => void }) {
  const headline = 'Forge Your Next AI Idea';
  const { displayed: typedHeadline, done: headlineDone } = useTyping(headline, 70, 300);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val);
  };

  const bountyCount = useCountUp(128, 1500);
  const promptCount = useCountUp(24, 1500);
  const memberCount = useCountUp(456, 1500);

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(247,243,233,0.3)] to-[rgba(250,250,249,0.9)]" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-moss-400/20 animate-leaf-drift"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-[800px] mx-auto">
        {/* Enso ring */}
        <svg className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] opacity-15 pointer-events-none" viewBox="0 0 400 400">
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke="var(--moss-400)"
            strokeWidth="2"
            strokeDasharray="1131"
            strokeDashoffset="0"
            style={{ animation: 'ensoDraw 2s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}
          />
        </svg>
        <style>{`
          @keyframes ensoDraw {
            from { stroke-dashoffset: 1131; }
            to { stroke-dashoffset: 0; }
          }
        `}</style>

        {/* Headline */}
        <h1 className="font-playfair text-[clamp(3rem,8vw,6rem)] font-bold text-moss-900 leading-none tracking-tight mb-6">
          {typedHeadline}
          {!headlineDone && <span className="animate-pulse">|</span>}
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={headlineDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="font-inter text-lg italic text-stone-700 max-w-[560px] leading-relaxed mb-8"
        >
          A living garden of AI bounty ideas — ready to plant, grow, and harvest with ChatGPT & agents.
        </motion.p>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={headlineDone ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2, ease: [0, 0, 0.2, 1] }}
          className="w-full max-w-[600px] mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="Search bounties, tags, or ideas..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-14 pl-12 pr-4 rounded-[16px] bg-stone-100 shadow-md border-2 border-transparent text-stone-700 placeholder:text-stone-400 focus:border-moss-400 focus:shadow-glow outline-none transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); onSearch(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={headlineDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-wrap items-center justify-center gap-4 mb-10"
        >
          <a
            href="#bounty-board"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[16px] bg-moss-700 text-cream font-inter font-medium shadow-sm hover:bg-moss-800 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-spring"
          >
            🌱 Explore Bounties
          </a>
          <Link
            to="/lab"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[16px] border-2 border-moss-700 text-moss-700 font-inter font-medium hover:bg-moss-50 transition-all duration-200"
          >
            ⚗️ Try the Prompt Lab
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={headlineDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-center gap-8 md:gap-12"
        >
          <div ref={bountyCount.ref} className="text-center">
            <div className="font-inter text-xl font-bold text-stone-700">{bountyCount.count}</div>
            <div className="text-xs text-stone-500 font-medium tracking-wide">🌿 Bounties</div>
          </div>
          <div ref={promptCount.ref} className="text-center">
            <div className="font-inter text-xl font-bold text-stone-700">{promptCount.count}K</div>
            <div className="text-xs text-stone-500 font-medium tracking-wide">✨ Prompts</div>
          </div>
          <div ref={memberCount.ref} className="text-center">
            <div className="font-inter text-xl font-bold text-stone-700">{memberCount.count}</div>
            <div className="text-xs text-stone-500 font-medium tracking-wide">🔥 Forged</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── How It Works ─────────────── */
const steps = [
  {
    emoji: '🌿',
    title: 'Discover',
    text: 'Browse our garden of AI bounty ideas. Each one is a self-contained project with multiple prompt variations — from beginner sprouts to advanced harvests.',
  },
  {
    emoji: '📚',
    title: 'Learn',
    text: 'See how every word in a prompt shapes the output. Hover underlined words to discover their effect. Understand temperature, tokens, and the anatomy of a great prompt.',
  },
  {
    emoji: '🔨',
    title: 'Forge',
    text: 'Take an idea and make it yours. Register to expand, convert, comment, and link your creations back to the original. The bounty stays pure — your version branches off.',
  },
];

function HowItWorksSection() {
  return (
    <section className="bg-stone-50 py-[6rem] md:py-[6rem]">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-900 text-center mb-16"
        >
          How Prompt Forge Works
        </motion.h2>

        <div className="relative flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-[3rem] left-[16%] right-[16%] h-px">
            <div
              className="h-full border-t-2 border-dashed border-moss-300 origin-left"
              style={{ animation: 'lineGrow 1s ease-breathe forwards' }}
            />
          </div>
          <style>{`
            @keyframes lineGrow {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }
          `}</style>

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.4, 0, 0.2, 1] }}
              className="flex-1 min-w-[280px] relative"
            >
              <div className="bg-stone-100 rounded-card p-8 shadow-sm border border-transparent hover:border-moss-300 hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-spring">
                <div className="text-5xl mb-4">{step.emoji}</div>
                <h3 className="font-inter text-xl font-semibold text-moss-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-base text-stone-600 leading-relaxed">
                  {step.text}
                </p>
              </div>
              {/* Leaf joint */}
              <div className="hidden md:flex absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-moss-200 rounded-full items-center justify-center text-moss-600 text-xs z-10">
                🌱
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Bounty Board ─────────────── */
function BountyBoardSection({ searchQuery }: { searchQuery: string }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(9);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let result = allBounties;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeFilter === 'trending') {
      result = [...result].sort((a, b) => b.likes - a.likes);
    } else if (activeFilter !== 'all') {
      result = result.filter((b) => b.difficulty === activeFilter);
    }
    return result;
  }, [activeFilter, searchQuery]);

  const visibleBounties = filtered.slice(0, visibleCount);

  return (
    <section id="bounty-board" className="bg-cream py-[4rem] md:py-[4rem]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10"
        >
          <h2 className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-900">
            🎯 The Bounty Board
          </h2>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => { setActiveFilter(f.value); setVisibleCount(9); }}
                className={`px-3.5 py-1.5 rounded-[9999px] text-xs font-medium transition-all duration-200 ${
                  activeFilter === f.value
                    ? 'bg-moss-700 text-cream'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {searchQuery && (
          <p className="text-sm text-stone-500 mb-4">
            Results for &ldquo;{searchQuery}&rdquo; — {filtered.length} found
          </p>
        )}

        {/* Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          <AnimatePresence mode="popLayout">
            {visibleBounties.map((bounty, i) => (
              <BountyCard key={bounty.id} bounty={bounty} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌱</div>
            <p className="text-stone-500 max-w-md mx-auto">
              No bounties match your search. Try different keywords or plant a new seed in the admin panel.
            </p>
          </div>
        )}

        {/* Load More */}
        {visibleCount < filtered.length && (
          <div className="text-center mt-10">
            <button
              onClick={() => setVisibleCount((c) => c + 6)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[8px] border-2 border-moss-700 text-moss-700 font-inter font-medium hover:bg-moss-50 transition-all duration-200"
            >
              Show More Bounties <ChevronDown size={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────── Prompt Lab Teaser ─────────────── */
function PromptLabTeaser() {
  const [sliderValue, setSliderValue] = useState(0);
  const words = ['creative', 'funny', 'dark', 'inspirational', 'whimsical'];
  const previews = [
    'A sunbeam dances through a crystal window, painting rainbows on the kitchen floor...',
    'A cat wearing a top hat tries to explain quantum physics to a confused goldfish...',
    'The shadows lengthened as the old clock struck thirteen, and nobody noticed...',
    'Every ending is a beginning wearing a disguise; you just have to look closer...',
    'A teapot named Bartholomew dreamed of sailing the seven seas on a spoon...',
  ];

  return (
    <section className="bg-moss-900 py-[6rem] md:py-[6rem] relative overflow-hidden">
      <div className="max-w-[1000px] mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center gap-12">
        {/* Left text */}
        <div className="flex-1">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="text-xs font-medium tracking-[0.1em] uppercase text-moss-400 mb-4"
          >
            ⚗️ INTERACTIVE
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-cream mb-4"
          >
            Build Better Prompts, Word by Word
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="text-lg text-moss-300 leading-relaxed max-w-[480px] mb-6"
          >
            Our Prompt Lab lets you experiment with temperature, tokens, and phrasing in real time. See how changing a single word can transform an AI&apos;s entire response.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link
              to="/lab"
              className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-100 font-medium transition-colors duration-200 group"
            >
              Enter the Prompt Lab
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
              <span className="block h-0.5 bg-current w-0 group-hover:w-full transition-all duration-300" />
            </Link>
          </motion.div>
        </div>

        {/* Right mini demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
          className="w-full md:w-[380px] bg-dark-surface border border-dark-border rounded-card p-6"
        >
          <p className="font-jetbrains text-sm text-dark-text mb-4">
            Write a{' '}
            <span className="text-amber-300 font-semibold">{words[sliderValue]}</span>{' '}
            story about a cat
          </p>
          <div className="mb-4">
            <label className="text-xs text-dark-muted mb-2 block">Creativity Level</label>
            <input
              type="range"
              min={0}
              max={4}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full accent-amber-300"
            />
          </div>
          <p className="text-sm text-dark-muted leading-relaxed">
            {previews[sliderValue]}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── Community Highlights ─────────────── */
function CommunityHighlights() {
  const featuredExpansions = expansions.slice(0, 3);

  return (
    <section className="bg-stone-50 py-[4rem] md:py-[4rem]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-12"
        >
          <h2 className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-900 mb-3">
            🌱 Community Garden
          </h2>
          <p className="text-stone-600 max-w-lg mx-auto">
            See how others have expanded and transformed bounty ideas
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {featuredExpansions.map((exp, i) => {
            const parent = allBounties.find((b) => b.id === exp.parentBountyId);
            const author = users.find((u) => u.id === exp.authorId);
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="bg-stone-100 rounded-card p-6 border border-transparent hover:border-moss-300 hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-spring"
              >
                <p className="text-xs text-moss-600 mb-3">
                  Expanded from:{' '}
                  <span className="font-medium">{parent?.title}</span>
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={author?.avatar}
                    alt={author?.username}
                    className="w-10 h-10 rounded-full bg-stone-200"
                  />
                  <div>
                    <p className="text-sm font-medium text-stone-800">{author?.username}</p>
                    <p className="text-xs text-stone-500">{exp.createdAt}</p>
                  </div>
                </div>
                <h3 className="font-inter text-base font-semibold text-moss-900 mb-2">
                  {exp.title}
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed line-clamp-3 mb-4">
                  {exp.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <span className="inline-flex items-center gap-1">
                    <Heart size={13} /> {exp.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={13} /> 0
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Link2 size={13} /> linked
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-center"
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-[16px] bg-moss-700 text-cream font-inter font-medium shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 animate-glow-pulse"
          >
            Register & Start Forging 🚀
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────── Home Page ─────────────── */
export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div>
      <HeroSection onSearch={setSearchQuery} />
      <HowItWorksSection />
      <BountyBoardSection searchQuery={searchQuery} />
      <PromptLabTeaser />
      <CommunityHighlights />
    </div>
  );
}
