import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  Heart,
  Bookmark,
  CheckCircle,
  Share2,
  MessageCircle,
  Copy,
  Check,
  ArrowLeft,
  Send,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Twitter,
  FileText,
  Layers,
  GitBranch,
  Mail,
  X,
  Clock,
  Wrench,
  User,
  Calendar,
  Eye,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { Bounty, Comment, Expansion } from '@/data/bounties';
import { bounties } from '@/data/bounties';
import { users } from '@/data/users';
import { expansions as seedExpansions } from '@/data/expansions';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────── localStorage helpers ───────────────────────── */

const LS_INTERACTIONS = 'prompt-forge-interactions';
const LS_COMMENTS = 'prompt-forge-comments';
const LS_EXPANSIONS = 'prompt-forge-expansions';

type InteractionType = 'like' | 'bookmark' | 'complete';

interface StoredComment extends Comment {
  bountyId: string;
}

interface InteractionRecord {
  bountyId: string;
  type: InteractionType;
  timestamp: number;
}

function getInteractions(): InteractionRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LS_INTERACTIONS) || '[]');
  } catch {
    return [];
  }
}

function setInteractions(recs: InteractionRecord[]) {
  localStorage.setItem(LS_INTERACTIONS, JSON.stringify(recs));
}

function hasInteraction(bountyId: string, type: InteractionType): boolean {
  return getInteractions().some((r) => r.bountyId === bountyId && r.type === type);
}

function toggleInteraction(bountyId: string, type: InteractionType) {
  const recs = getInteractions();
  const exists = recs.some((r) => r.bountyId === bountyId && r.type === type);
  if (exists) {
    setInteractions(recs.filter((r) => !(r.bountyId === bountyId && r.type === type)));
    return false;
  }
  setInteractions([...recs, { bountyId, type, timestamp: Date.now() }]);
  return true;
}

function getStoredComments(): StoredComment[] {
  try {
    return JSON.parse(localStorage.getItem(LS_COMMENTS) || '[]');
  } catch {
    return [];
  }
}

function setStoredComments(comments: StoredComment[]) {
  localStorage.setItem(LS_COMMENTS, JSON.stringify(comments));
}

function getStoredExpansions(): Expansion[] {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_EXPANSIONS) || '[]');
    return stored;
  } catch {
    return [];
  }
}

function setStoredExpansions(exps: Expansion[]) {
  localStorage.setItem(LS_EXPANSIONS, JSON.stringify(exps));
}

function ensureSeedExpansions() {
  const stored = getStoredExpansions();
  if (stored.length === 0) {
    const mapped = seedExpansions.map((e) => ({
      id: e.id,
      parentBountyId: e.parentBountyId,
      authorId: e.authorId,
      title: e.title,
      description: e.description,
      createdAt: e.createdAt,
      likes: e.likes,
    })) as Expansion[];
    setStoredExpansions(mapped);
    return mapped;
  }
  return stored;
}

/* ─────────────────────────── ScrollReveal (GSAP) ─────────────────────────── */

function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );
  }, { scope: ref });

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}

/* ─────────────────────────── WordEffectTooltip ─────────────────────────── */

function WordEffectTooltip({
  word,
  explanation,
  alternative,
  children,
}: {
  word: string;
  explanation: string;
  alternative: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setShow(true);
  };

  const handleLeave = () => {
    timerRef.current = setTimeout(() => setShow(false), 150);
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span className="border-b-2 border-dotted border-moss-400 cursor-help">
        {children}
      </span>
      <AnimatePresence>
        {show && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] block"
          >
            <span className="block bg-cream shadow-md rounded-[8px] p-4 text-sm">
              <span className="font-jetbrains text-xs bg-moss-700 text-cream px-1.5 py-0.5 rounded">
                {word}
              </span>
              <span className="block mt-2 font-crimson text-stone-700 leading-relaxed">
                {explanation}
              </span>
              <span className="block mt-2 text-xs text-stone-500">
                Try: <em className="text-moss-700">{alternative}</em>
              </span>
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ─────────────────────────── PromptCard ─────────────────────────── */

function PromptCard({
  prompt,
  index,
  wordEffects,
}: {
  prompt: { level: 'beginner' | 'intermediate' | 'advanced'; text: string };
  index: number;
  wordEffects: { word: string; explanation: string; alternative: string }[];
}) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const levelConfig = {
    beginner: { label: '🌱 Beginner', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    intermediate: { label: '🌿 Intermediate', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    advanced: { label: '🌳 Advanced', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  const config = levelConfig[prompt.level];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -6, y: x * 6 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const renderText = () => {
    let text = prompt.text;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find all word effect matches with their positions
    const matches: { start: number; end: number; effect: typeof wordEffects[0] }[] = [];
    for (const effect of wordEffects) {
      const regex = new RegExp(`\\b${effect.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let m;
      while ((m = regex.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, effect });
      }
    }

    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches
    const filtered: typeof matches = [];
    for (const match of matches) {
      if (filtered.length === 0 || match.start >= filtered[filtered.length - 1].end) {
        filtered.push(match);
      }
    }

    for (const match of filtered) {
      if (match.start > lastIndex) {
        elements.push(<span key={`plain-${match.start}`}>{text.slice(lastIndex, match.start)}</span>);
      }
      elements.push(
        <WordEffectTooltip
          key={`we-${match.start}`}
          word={match.effect.word}
          explanation={match.effect.explanation}
          alternative={match.effect.alternative}
        >
          {text.slice(match.start, match.end)}
        </WordEffectTooltip>
      );
      lastIndex = match.end;
    }

    if (lastIndex < text.length) {
      elements.push(<span key={`plain-end`}>{text.slice(lastIndex)}</span>);
    }

    return elements.length > 0 ? elements : text;
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transformStyle: 'preserve-3d',
      }}
      className="bg-stone-50 rounded-card border-l-[3px] border-moss-400 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
          </span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-stone-100 hover:bg-moss-100 text-stone-600 hover:text-moss-700 transition-colors duration-200 text-xs font-medium"
            aria-label="Copy prompt"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="font-jetbrains text-[0.9375rem] leading-relaxed text-moss-900 whitespace-pre-wrap">
          {renderText()}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────── ConvertModal ─────────────────────────── */

function ConvertModal({
  open,
  onClose,
  bounty,
}: {
  open: boolean;
  onClose: () => void;
  bounty: Bounty;
}) {
  const [format, setFormat] = useState<string>('tweet');
  const [generated, setGenerated] = useState('');

  const formats = [
    { key: 'tweet', label: 'Tweet Thread', icon: Twitter, desc: 'Break into 5-7 tweet-sized chunks' },
    { key: 'blog', label: 'Blog Post', icon: FileText, desc: 'Expand into a full tutorial article' },
    { key: 'notion', label: 'Notion Doc', icon: Layers, desc: 'Formatted with headings and checkboxes' },
    { key: 'github', label: 'GitHub Issue', icon: GitBranch, desc: 'Structured as a feature request' },
    { key: 'email', label: 'Email Pitch', icon: Mail, desc: 'Executive summary format' },
  ];

  const generate = () => {
    let content = '';
    switch (format) {
      case 'tweet':
        content = `🧵 ${bounty.title} — AI Prompt Bounty\n\n1/ ${bounty.description.slice(0, 120)}...\n\n2/ Difficulty: ${bounty.difficulty}\nEstimated time: ${bounty.estimatedTime}\n\n3/ Tools: ${bounty.tools.join(', ')}\n\n4/ Beginner prompt:\n${bounty.prompts[0]?.text.slice(0, 100)}...\n\n5/ Want the full prompts? Check the bounty board 🔗\n\n#PromptForge #AI`;
        break;
      case 'blog':
        content = `# ${bounty.title}\n\n## Overview\n\n${bounty.description}\n\n## Difficulty & Time\n- **Difficulty:** ${bounty.difficulty}\n- **Time:** ${bounty.estimatedTime}\n\n## Tools You'll Need\n${bounty.tools.map((t) => `- ${t}`).join('\n')}\n\n## Prompt Variations\n\n### Beginner\n${bounty.prompts[0]?.text}\n\n### Intermediate\n${bounty.prompts[1]?.text}\n\n### Advanced\n${bounty.prompts[2]?.text}\n\n---\n*Shared from Prompt Forge*\n`;
        break;
      case 'notion':
        content = `## ${bounty.title}\n\n☐ Read overview\n☐ Gather tools: ${bounty.tools.join(', ')}\n☐ Try beginner prompt\n☐ Try intermediate prompt\n☐ Try advanced prompt\n☐ Share results\n\n**Description:**\n${bounty.description}\n\n**Prompts:**\n${bounty.prompts.map((p) => `- [${p.level}] ${p.text}`).join('\n')}\n`;
        break;
      case 'github':
        content = `## Feature Request: ${bounty.title}\n\n**Description:**\n${bounty.description}\n\n**Scope:**\n- Difficulty: ${bounty.difficulty}\n- Estimated time: ${bounty.estimatedTime}\n\n**Implementation Notes:**\n${bounty.prompts.map((p) => `- **${p.level}:** ${p.text}`).join('\n')}\n\n**Tools:** ${bounty.tools.join(', ')}\n\n/label ~enhancement ~documentation`;
        break;
      case 'email':
        content = `Subject: AI Project Idea — ${bounty.title}\n\nHi team,\n\nI came across an interesting AI bounty idea I think we should explore:\n\n${bounty.description}\n\nKey details:\n- Difficulty: ${bounty.difficulty}\n- Time estimate: ${bounty.estimatedTime}\n- Tools: ${bounty.tools.join(', ')}\n\nLet me know if you'd like to dive deeper.\n\nBest,\n`;
        break;
      default:
        content = '';
    }
    setGenerated(content);
  };

  useEffect(() => {
    if (open) generate();
  }, [open, format]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generated);
    toast.success('Copied to clipboard!');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
            className="relative bg-stone-100 rounded-modal shadow-lg max-w-[600px] w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-playfair text-xl font-bold text-moss-900">
                  <Zap size={18} className="inline mr-2" />
                  Convert This Bounty
                </h3>
                <button onClick={onClose} className="p-1 rounded hover:bg-stone-200 transition-colors">
                  <X size={18} className="text-stone-500" />
                </button>
              </div>

              <div className="grid gap-3 mb-5">
                {formats.map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFormat(f.key)}
                      className={`flex items-start gap-3 p-3 rounded-button text-left border transition-all duration-200 ${
                        format === f.key
                          ? 'border-moss-400 bg-moss-50'
                          : 'border-stone-200 hover:border-moss-300 bg-white'
                      }`}
                    >
                      <Icon size={18} className="mt-0.5 text-stone-500" />
                      <div>
                        <div className="text-sm font-medium text-stone-900">{f.label}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{f.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Preview
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-moss-700 text-cream text-xs font-medium hover:bg-moss-800 transition-colors"
                >
                  <Copy size={12} />
                  Copy
                </button>
              </div>
              <pre className="bg-white rounded-card p-4 font-jetbrains text-xs leading-relaxed text-stone-700 whitespace-pre-wrap max-h-60 overflow-y-auto border border-stone-200">
                {generated}
              </pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────── ExpansionModal ─────────────────────────── */

function ExpansionModal({
  open,
  onClose,
  bountyId,
  bountyTitle,
  onPublish,
}: {
  open: boolean;
  onClose: () => void;
  bountyId: string;
  bountyTitle: string;
  onPublish: (exp: Expansion) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [changes, setChanges] = useState('');
  const [tags, setTags] = useState('');

  const handlePublish = () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }
    const newExp: Expansion = {
      id: `exp-${Date.now()}`,
      parentBountyId: bountyId,
      authorId: 'u1',
      title: title.trim(),
      description: `${description.trim()}\n\n**What changed:** ${changes.trim() || 'N/A'}\n\n**Tags:** ${tags.trim() || 'N/A'}`,
      createdAt: new Date().toISOString().slice(0, 10),
      likes: 0,
    };
    onPublish(newExp);
    setTitle('');
    setDescription('');
    setChanges('');
    setTags('');
    onClose();
    toast.success('Expansion published!');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
            className="relative bg-stone-100 rounded-modal shadow-lg max-w-[560px] w-full max-h-[85vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-playfair text-xl font-bold text-moss-900">
                  <Lightbulb size={18} className="inline mr-2" />
                  Expand This Idea
                </h3>
                <button onClick={onClose} className="p-1 rounded hover:bg-stone-200 transition-colors">
                  <X size={18} className="text-stone-500" />
                </button>
              </div>

              <div className="mb-3 text-xs text-stone-500">
                Branching from <span className="font-medium text-moss-700">{bountyTitle}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Browser Extension Companion"
                    className="w-full px-3 py-2 rounded-button bg-white border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-moss-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your expansion idea..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-button bg-white border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-moss-400 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    What changed from the original?
                  </label>
                  <textarea
                    value={changes}
                    onChange={(e) => setChanges(e.target.value)}
                    placeholder="What makes your version different?"
                    rows={3}
                    className="w-full px-3 py-2 rounded-button bg-white border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-moss-400 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Tags</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. extension, browser, automation"
                    className="w-full px-3 py-2 rounded-button bg-white border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-moss-400 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-button text-sm font-medium text-stone-600 hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePublish}
                  className="px-4 py-2 rounded-button bg-moss-700 text-cream text-sm font-medium hover:bg-moss-800 transition-colors"
                >
                  Publish Expansion
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────── ShareDropdown ─────────────────────────── */

function ShareDropdown({ bounty }: { bounty: Bounty }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/#/bounty/${bounty.id}` : '';

  const actions = [
    {
      label: 'Copy Link',
      action: async () => {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied!');
        setOpen(false);
      },
    },
    {
      label: 'Tweet',
      action: () => {
        const text = encodeURIComponent(`Check out this AI bounty: ${bounty.title}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        setOpen(false);
      },
    },
    {
      label: 'Email',
      action: () => {
        const subject = encodeURIComponent(`AI Bounty: ${bounty.title}`);
        const body = encodeURIComponent(`I found this interesting AI project idea:\n\n${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
        setOpen(false);
      },
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-11 h-11 rounded-full bg-stone-200 hover:bg-moss-200 flex items-center justify-center transition-colors duration-200"
        aria-label="Share"
      >
        <Share2 size={18} className="text-stone-600" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
            className="absolute top-full mt-2 right-0 bg-white rounded-modal shadow-lg border border-stone-200 w-44 z-50 overflow-hidden"
          >
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.action}
                className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-moss-50 transition-colors"
              >
                {a.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── CommentItem ─────────────────────────── */

function CommentItem({
  comment,
  replies,
  onReply,
  depth = 0,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (parentId: string, text: string) => void;
  depth?: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const author = users.find((u) => u.id === comment.authorId);

  const handleSubmit = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText('');
    setReplyOpen(false);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-moss-200' : ''}`}>
      <div className="flex gap-3 py-3">
        <img
          src={author?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown'}
          alt={author?.username || 'user'}
          className="w-9 h-9 rounded-full bg-stone-200 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-stone-900">
              {author?.username || 'Unknown'}
            </span>
            <span className="text-xs text-stone-400">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="text-sm text-stone-700 leading-relaxed">
            <ReactMarkdown>{comment.text}</ReactMarkdown>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => setReplyOpen(!replyOpen)}
              className="text-xs text-stone-500 hover:text-moss-700 transition-colors flex items-center gap-1"
            >
              <MessageCircle size={12} />
              Reply
            </button>
          </div>
          <AnimatePresence>
            {replyOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                className="overflow-hidden"
              >
                <div className="mt-2 flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-button bg-stone-100 border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-moss-400 transition-colors resize-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    className="px-3 py-2 rounded-button bg-moss-700 text-cream text-sm font-medium hover:bg-moss-800 transition-colors self-end"
                  >
                    <Send size={14} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {replies.map((reply) => (
        <CommentItem key={reply.id} comment={reply} replies={[]} onReply={onReply} depth={depth + 1} />
      ))}
    </div>
  );
}

/* ─────────────────────────── RelatedBountyCard ─────────────────────────── */

function RelatedBountyCard({ bounty, index }: { bounty: Bounty; index: number }) {
  const difficultyConfig = {
    easy: { circle: 'bg-difficulty-easy', label: 'Beginner', bg: 'bg-green-50', text: 'text-green-700' },
    medium: { circle: 'bg-difficulty-medium', label: 'Intermediate', bg: 'bg-amber-50', text: 'text-amber-700' },
    hard: { circle: 'bg-difficulty-hard', label: 'Advanced', bg: 'bg-red-50', text: 'text-red-700' },
  };
  const d = difficultyConfig[bounty.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      }}
    >
      <Link
        to={`/bounty/${bounty.id}`}
        className="block bg-stone-100 rounded-card border border-stone-200 p-6 hover:-translate-y-1.5 hover:shadow-lg hover:border-moss-300 transition-all duration-200 ease-spring"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 text-xs font-medium">
            <span className={`w-2.5 h-2.5 rounded-full ${d.circle}`} />
            <span className={d.text}>{d.label}</span>
          </span>
          <span className="text-2xl ml-auto">{bounty.emoji}</span>
        </div>
        <h4 className="font-inter text-lg font-bold text-moss-900 mb-2 line-clamp-2">
          {bounty.title}
        </h4>
        <p className="text-sm text-stone-500 line-clamp-3 mb-4">{bounty.description}</p>
        <div className="flex flex-wrap gap-2">
          {bounty.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-pill bg-moss-100 text-moss-700 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────── WordEffectsSection ─────────────────────────── */

function WordEffectsSection({ wordEffects }: { wordEffects: { word: string; explanation: string; alternative: string }[] }) {
  return (
    <section className="bg-stone-50 py-12 lg:py-16">
      <div className="max-w-[900px] mx-auto px-4 lg:px-8">
        <ScrollReveal>
          <div className="mb-8">
            <h2 className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-900 mb-2">
              <Sparkles size={24} className="inline mr-2" />
              How Words Shape the Output
            </h2>
            <p className="text-stone-500 body-md">
              Changing one word can transform an AI's entire response. Hover the underlined words in prompts to learn their magic.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wordEffects.map((we, i) => (
            <ScrollReveal key={we.word} delay={i * 0.1}>
              <div className="bg-stone-100 rounded-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-jetbrains text-xs bg-moss-700 text-cream px-2 py-1 rounded">
                    {we.word}
                  </span>
                  <span className="text-xs text-stone-500">Tone Modifier</span>
                </div>
                <p className="font-crimson text-stone-700 leading-relaxed mb-3">
                  {we.explanation}
                </p>
                <p className="text-xs text-stone-500">
                  Alternative: <em className="text-moss-700">{we.alternative}</em>
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */

export default function BountyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentPreview, setCommentPreview] = useState(false);
  const [comments, setComments] = useState<(Comment | StoredComment)[]>([]);
  const [convertOpen, setConvertOpen] = useState(false);
  const [expansionOpen, setExpansionOpen] = useState(false);
  const [expansions, setExpansions] = useState<Expansion[]>([]);
  const [related, setRelated] = useState<Bounty[]>([]);

  useEffect(() => {
    const found = bounties.find((b) => b.id === id);
    if (!found) {
      navigate('/');
      return;
    }

    // Merge stored comments
    const storedComments = getStoredComments().filter((c) => c.bountyId === id);
    const mergedComments = [...found.comments, ...storedComments];

    // Ensure seed expansions exist
    const storedExps = ensureSeedExpansions();
    const bountyExps = storedExps.filter((e) => e.parentBountyId === id);

    // Interactions
    setLiked(hasInteraction(id!, 'like'));
    setBookmarked(hasInteraction(id!, 'bookmark'));
    setCompleted(hasInteraction(id!, 'complete'));

    setBounty({ ...found, comments: mergedComments });
    setLikeCount(found.likes + storedComments.length * 0); // likes are separate
    setComments(mergedComments);
    setExpansions(bountyExps);

    // Related bounties by tag similarity
    const relatedBounties = bounties
      .filter((b) => b.id !== id)
      .map((b) => ({
        bounty: b,
        score: b.tags.filter((t) => found.tags.includes(t)).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.bounty);
    setRelated(relatedBounties);
  }, [id, navigate]);

  const handleLike = () => {
    const active = toggleInteraction(id!, 'like');
    setLiked(active);
    setLikeCount((c) => (active ? c + 1 : c - 1));
    toast(active ? 'You liked this bounty!' : 'Like removed', { icon: active ? '❤️' : '💔' });
  };

  const handleBookmark = () => {
    const active = toggleInteraction(id!, 'bookmark');
    setBookmarked(active);
    toast(active ? 'Added to favorites!' : 'Removed from favorites');
  };

  const handleComplete = () => {
    const active = toggleInteraction(id!, 'complete');
    setCompleted(active);
    toast(active ? 'Marked as done! Great work!' : 'Unmarked');
  };

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    const newComment: StoredComment = {
      id: `c-${Date.now()}`,
      bountyId: id!,
      authorId: 'u1',
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const allStored = getStoredComments();
    allStored.push(newComment);
    setStoredComments(allStored);
    setComments((prev) => [...prev, newComment]);
    setCommentText('');
    toast.success('Comment posted!');
  };

  const handleReply = (parentId: string, text: string) => {
    const newReply: StoredComment = {
      id: `c-${Date.now()}`,
      bountyId: id!,
      authorId: 'u1',
      text,
      createdAt: new Date().toISOString(),
      parentId,
    };
    const allStored = getStoredComments();
    allStored.push(newReply);
    setStoredComments(allStored);
    setComments((prev) => [...prev, newReply]);
    toast.success('Reply posted!');
  };

  const handlePublishExpansion = (exp: Expansion) => {
    const all = getStoredExpansions();
    all.push(exp);
    setStoredExpansions(all);
    setExpansions((prev) => [...prev, exp]);
  };

  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  if (!bounty) return null;

  const difficultyConfig = {
    easy: { circle: 'bg-difficulty-easy', label: 'Beginner' },
    medium: { circle: 'bg-difficulty-medium', label: 'Intermediate' },
    hard: { circle: 'bg-difficulty-hard', label: 'Advanced' },
  };
  const diff = difficultyConfig[bounty.difficulty];

  const statusConfig = {
    new: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'New' },
    inprogress: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
  };
  const status = statusConfig[bounty.status];

  return (
    <div className="min-h-[100dvh]">
      {/* ─── Hero Header ─── */}
      <section className="bg-cream pt-24 pb-12 lg:pt-32 lg:pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-moss-50/60 to-transparent pointer-events-none" />
        <div className="max-w-[1000px] mx-auto px-4 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            className="mb-6"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-moss-600 hover:text-moss-800 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Bounty Board
            </Link>
          </motion.div>

          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
              className="text-[4rem] leading-none mb-4"
            >
              {bounty.emoji}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
              className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-900 mb-4"
            >
              {bounty.title}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
              className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-stone-500 mb-4"
            >
              <span className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-full ${diff.circle}`} />
                {diff.label}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {bounty.estimatedTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Wrench size={12} />
                {bounty.tools.length} tools
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User size={12} />
                by {bounty.author}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Planted {new Date(bounty.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {bounty.views} views
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
              className="flex flex-wrap items-center justify-center gap-2 mb-6"
            >
              {bounty.tags.map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 + i * 0.06 }}
                  className="px-3 py-1 rounded-pill bg-moss-100 text-moss-700 text-xs font-medium"
                >
                  {tag}
                </motion.span>
              ))}
              <span className={`px-3 py-1 rounded-pill text-xs font-medium ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </motion.div>

            {/* Action Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex items-center justify-center gap-3"
            >
              <motion.button
                whileTap={{ scale: liked ? 1.3 : 1.1 }}
                onClick={handleLike}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  liked ? 'bg-red-50 text-red-500' : 'bg-stone-200 text-stone-600 hover:bg-moss-200 hover:text-moss-700'
                }`}
                aria-label="Like"
              >
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              </motion.button>
              <span className="text-xs text-stone-500 -ml-1 mr-1">{likeCount}</span>

              <motion.button
                whileTap={{ scale: 1.1 }}
                onClick={handleBookmark}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  bookmarked ? 'bg-amber-50 text-amber-600' : 'bg-stone-200 text-stone-600 hover:bg-moss-200 hover:text-moss-700'
                }`}
                aria-label="Bookmark"
              >
                <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 1.1 }}
                onClick={handleComplete}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  completed ? 'bg-green-50 text-green-600' : 'bg-stone-200 text-stone-600 hover:bg-moss-200 hover:text-moss-700'
                }`}
                aria-label="Mark as done"
              >
                <CheckCircle size={18} fill={completed ? 'currentColor' : 'none'} />
              </motion.button>

              <ShareDropdown bounty={bounty} />

              <motion.button
                whileTap={{ scale: 1.1 }}
                onClick={() => setConvertOpen(true)}
                className="w-11 h-11 rounded-full bg-stone-200 text-stone-600 hover:bg-moss-200 hover:text-moss-700 flex items-center justify-center transition-colors duration-200"
                aria-label="Convert"
              >
                <Zap size={18} />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Description & Overview ─── */}
      <section className="bg-stone-50 py-12 lg:py-16">
        <div className="max-w-[800px] mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <span className="block text-xs uppercase tracking-[0.1em] text-stone-500 mb-4">
              📖 Overview
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="bg-stone-100 rounded-card shadow-sm p-6 lg:p-8 mb-8">
              <div className="prose prose-stone max-w-none">
                <ReactMarkdown>{bounty.description}</ReactMarkdown>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '🎯', label: 'Goal', text: `Build a working ${bounty.title.toLowerCase()} prototype` },
              { icon: '🛠️', label: 'Output', text: `Functional agent or automation pipeline` },
              { icon: '📚', label: 'Prerequisites', text: `Basic ${bounty.tools[0] || 'coding'} knowledge` },
              { icon: '💡', label: 'Pro Tip', text: `Start with the beginner prompt, then iterate` },
            ].map((fact, i) => (
              <ScrollReveal key={fact.label} delay={i * 0.1}>
                <div className="bg-moss-50 rounded-button p-4 flex items-start gap-3">
                  <span className="text-lg">{fact.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-moss-800 mb-0.5">{fact.label}</div>
                    <div className="text-sm text-stone-700">{fact.text}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Prompt Variations ─── */}
      <section className="bg-cream py-12 lg:py-16">
        <div className="max-w-[900px] mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <div className="mb-8">
              <h2 className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-900 mb-2">
                🎯 Prompt Variations
              </h2>
              <p className="text-stone-500 body-md">
                Copy, tweak, and send these prompts to ChatGPT or your favorite agent. Hover underlined words to learn their magic.
              </p>
            </div>
          </ScrollReveal>

          <div className="flex flex-col gap-6">
            {bounty.prompts.map((p, i) => (
              <PromptCard key={p.level} prompt={p} index={i} wordEffects={bounty.wordEffects} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Word Effects ─── */}
      <WordEffectsSection wordEffects={bounty.wordEffects} />

      {/* ─── Tools & Resources ─── */}
      <section className="bg-cream py-8 lg:py-12">
        <div className="max-w-[800px] mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <span className="block text-xs uppercase tracking-[0.1em] text-stone-500 mb-4">
              🛠️ Tools & Resources
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="flex flex-wrap gap-3">
              {bounty.tools.map((tool, i) => (
                <motion.span
                  key={tool}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-stone-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-sm text-stone-700"
                >
                  <Wrench size={14} className="text-stone-400" />
                  {tool}
                </motion.span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── User Interactions ─── */}
      <section className="bg-stone-50 py-8 border-y border-stone-200">
        <div className="max-w-[800px] mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleLike}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-medium transition-colors ${
                  liked
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-moss-700 text-cream hover:bg-moss-800'
                }`}
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Liked' : 'Like'} ({likeCount})
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleBookmark}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-medium transition-colors ${
                  bookmarked
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'border-2 border-moss-700 text-moss-700 hover:bg-moss-50'
                }`}
              >
                <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                {bookmarked ? 'Saved' : 'Save'}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleComplete}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-medium transition-colors ${
                  completed
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : 'border-2 border-stone-300 text-stone-600 hover:border-moss-400 hover:text-moss-700'
                }`}
              >
                <CheckCircle size={16} fill={completed ? 'currentColor' : 'none'} />
                {completed ? 'Done' : 'Mark as Done'}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setExpansionOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-medium bg-moss-700 text-cream hover:bg-moss-800 transition-colors"
              >
                <Lightbulb size={16} />
                Expand This Idea
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConvertOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-medium border-2 border-stone-300 text-stone-600 hover:border-moss-400 hover:text-moss-700 transition-colors"
              >
                <Zap size={16} />
                Convert
              </motion.button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm text-stone-500">Share this bounty:</span>
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/#/bounty/${bounty.id}`;
                  await navigator.clipboard.writeText(url);
                  toast.success('Link copied!');
                }}
                className="p-2 rounded-full bg-stone-200 hover:bg-moss-200 text-stone-600 hover:text-moss-700 transition-colors"
                aria-label="Copy link"
              >
                <Copy size={14} />
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out: ${bounty.title}`)}&url=${encodeURIComponent(`${window.location.origin}/#/bounty/${bounty.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-stone-200 hover:bg-moss-200 text-stone-600 hover:text-moss-700 transition-colors"
                aria-label="Tweet"
              >
                <Twitter size={14} />
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(`AI Bounty: ${bounty.title}`)}&body=${encodeURIComponent(`${window.location.origin}/#/bounty/${bounty.id}`)}`}
                className="p-2 rounded-full bg-stone-200 hover:bg-moss-200 text-stone-600 hover:text-moss-700 transition-colors"
                aria-label="Email"
              >
                <Mail size={14} />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Comments ─── */}
      <section className="bg-stone-50 py-12 lg:py-16">
        <div className="max-w-[800px] mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <button
              onClick={() => setCommentsExpanded(!commentsExpanded)}
              className="flex items-center gap-2 mb-6 group"
            >
              <h2 className="font-playfair text-xl font-semibold text-moss-900">
                <MessageCircle size={20} className="inline mr-2" />
                Discussion
              </h2>
              <span className="px-2 py-0.5 rounded-pill bg-moss-100 text-moss-700 text-xs font-medium">
                {comments.length}
              </span>
              {commentsExpanded ? (
                <ChevronUp size={16} className="text-stone-400 group-hover:text-moss-700 transition-colors" />
              ) : (
                <ChevronDown size={16} className="text-stone-400 group-hover:text-moss-700 transition-colors" />
              )}
            </button>
          </ScrollReveal>

          <AnimatePresence>
            {commentsExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                className="overflow-hidden"
              >
                {/* Comment input */}
                <div className="mb-6">
                  <div className="bg-stone-100 rounded-card p-4">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Share your thoughts, questions, or experience with this bounty..."
                      rows={4}
                      className="w-full px-3 py-2 rounded-button bg-white border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-moss-400 transition-colors resize-none"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setCommentPreview(!commentPreview)}
                          className="text-xs text-stone-500 hover:text-moss-700 transition-colors"
                        >
                          {commentPreview ? 'Edit' : 'Preview'}
                        </button>
                        <span className="text-xs text-stone-400">
                          **bold**, *italic*, `code`
                        </span>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePostComment}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-moss-700 text-cream text-sm font-medium hover:bg-moss-800 transition-colors"
                      >
                        <Send size={14} />
                        Post
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {commentPreview && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 prose prose-stone max-w-none text-sm overflow-hidden"
                        >
                          <ReactMarkdown>{commentText || '*Nothing to preview*'}</ReactMarkdown>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Comment threads */}
                <div className="space-y-1">
                  <AnimatePresence>
                    {rootComments.map((c) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CommentItem
                          comment={c}
                          replies={getReplies(c.id)}
                          onReply={handleReply}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {rootComments.length === 0 && (
                    <p className="text-sm text-stone-400 text-center py-8">
                      No comments yet. Be the first to share your thoughts!
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── Linked Expansions ─── */}
      <section className="bg-cream py-12 lg:py-16">
        <div className="max-w-[900px] mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <div className="mb-8">
              <h2 className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-900 mb-2">
                🌿 Expansions & Variants
              </h2>
              <p className="text-stone-500 body-md">
                The original bounty above remains untouched. These are community-grown branches.
              </p>
            </div>
          </ScrollReveal>

          <div className="flex flex-col gap-4 mb-8">
            {expansions.map((exp, i) => {
              const author = users.find((u) => u.id === exp.authorId);
              return (
                <ScrollReveal key={exp.id} delay={i * 0.1}>
                  <div className="bg-stone-100 rounded-card border border-stone-200 p-5 hover:-translate-y-1 hover:shadow-md hover:border-moss-300 transition-all duration-200">
                    <div className="text-xs text-moss-700 mb-2">
                      🌱 Branch of{' '}
                      <span className="font-medium">{bounty.title}</span>
                    </div>
                    <h4 className="font-inter text-base font-bold text-moss-900 mb-1">
                      {exp.title}
                    </h4>
                    <p className="text-sm text-stone-500 mb-3 line-clamp-2">
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <img
                        src={author?.avatar}
                        alt={author?.username}
                        className="w-6 h-6 rounded-full bg-stone-200"
                      />
                      <span className="text-xs text-stone-500">
                        By @{author?.username} • {new Date(exp.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          <ScrollReveal>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setExpansionOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-button bg-moss-700 text-cream font-medium hover:bg-moss-800 transition-colors animate-glow-pulse"
            >
              <Lightbulb size={18} />
              Expand This Idea
            </motion.button>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Related Bounties ─── */}
      <section className="bg-stone-50 py-12 lg:py-16">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
          <ScrollReveal>
            <h2 className="font-playfair text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-moss-900 mb-8">
              🌱 You Might Also Like
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((b, i) => (
              <RelatedBountyCard key={b.id} bounty={b} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Modals ─── */}
      <ConvertModal open={convertOpen} onClose={() => setConvertOpen(false)} bounty={bounty} />
      <ExpansionModal
        open={expansionOpen}
        onClose={() => setExpansionOpen(false)}
        bountyId={bounty.id}
        bountyTitle={bounty.title}
        onPublish={handlePublishExpansion}
      />
    </div>
  );
}
