import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import {
  ChevronDown,
  RefreshCw,
  Send,
  Copy,
  Check,
  Lightbulb,
  BookOpen,
  Sparkles,
  Terminal,
  FlaskConical,
  Thermometer,
  Target,
  Ruler,
  FileText,
  Code,
  Table,
  ListOrdered,
  Hash,
  Search,
  Plus,
  RotateCcw,
  Zap,
  BrainCircuit,
  Layers,
  PenTool,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─────────────── Types ─────────────── */
interface PromptHistoryItem {
  id: string;
  prompt: string;
  timestamp: number;
  params: ParameterState;
}

interface ParameterState {
  temperature: number;
  topP: number;
  maxTokens: number;
  format: OutputFormat;
}

type OutputFormat = 'text' | 'markdown' | 'json' | 'table' | 'list';

interface WordEffect {
  word: string;
  category: 'role' | 'format' | 'tone' | 'structure' | 'audience' | 'intent';
  description: string;
  tip: string;
  color: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  preview: string;
  content: string;
}

/* ─────────────── Constants ─────────────── */
const WORD_EFFECTS: WordEffect[] = [
  { word: 'Act as', category: 'role', description: 'Role Definition', tip: 'Assigns a specific persona to the AI, shaping tone and expertise.', color: '#6b9b6b' },
  { word: 'You are', category: 'role', description: 'Role Definition', tip: 'Alternative to "Act as" — establishes identity and expertise level.', color: '#6b9b6b' },
  { word: 'JSON', category: 'format', description: 'Format Enforcer', tip: 'Forces structured machine-readable output with keys and values.', color: '#f59e0b' },
  { word: 'table', category: 'format', description: 'Format Enforcer', tip: 'Requests tabular output — great for comparisons.', color: '#f59e0b' },
  { word: 'list', category: 'format', description: 'Format Enforcer', tip: 'Bullet or numbered lists improve scanability.', color: '#f59e0b' },
  { word: 'creative', category: 'tone', description: 'Tone Modifier', tip: 'Encourages novel, imaginative responses with more varied vocabulary.', color: '#a855f7' },
  { word: 'professional', category: 'tone', description: 'Tone Modifier', tip: 'Produces formal, polished language suitable for business.', color: '#a855f7' },
  { word: 'funny', category: 'tone', description: 'Tone Modifier', tip: 'Adds humor and levity — use cautiously for serious topics.', color: '#a855f7' },
  { word: 'serious', category: 'tone', description: 'Tone Modifier', tip: 'Strips out jokes and casual language for gravitas.', color: '#a855f7' },
  { word: 'step by step', category: 'structure', description: 'Structure Guide', tip: 'Breaks reasoning into sequential chunks, improving accuracy.', color: '#3b82f6' },
  { word: 'first', category: 'structure', description: 'Structure Guide', tip: 'Explicit sequencing helps the AI organize multi-part answers.', color: '#3b82f6' },
  { word: 'then', category: 'structure', description: 'Structure Guide', tip: 'Temporal connector that reinforces ordered output.', color: '#3b82f6' },
  { word: 'for a beginner', category: 'audience', description: 'Audience Tailor', tip: 'Adjusts complexity downward — jargon is explained or avoided.', color: '#ec4899' },
  { word: 'expert', category: 'audience', description: 'Audience Tailor', tip: 'Expects domain knowledge — uses technical terms without explanation.', color: '#ec4899' },
  { word: 'critique', category: 'intent', description: 'Intent Signal', tip: 'Switches mode from creation to analysis — finds flaws and improvements.', color: '#ef4444' },
  { word: 'brainstorm', category: 'intent', description: 'Intent Signal', tip: 'Generates many ideas quickly without filtering — quantity over quality.', color: '#ef4444' },
  { word: 'compare and contrast', category: 'intent', description: 'Intent Signal', tip: 'Forces side-by-side evaluation, highlighting similarities and differences.', color: '#ef4444' },
  { word: 'explain like I\'m 5', category: 'audience', description: 'ELI5 Mode', tip: 'Uses simple analogies and avoids all technical language.', color: '#ec4899' },
  { word: 'brief', category: 'tone', description: 'Length Modifier', tip: 'Forces conciseness — the AI will cut elaboration.', color: '#a855f7' },
  { word: 'detailed', category: 'tone', description: 'Length Modifier', tip: 'Encourages expansion with examples, edge cases, and nuance.', color: '#a855f7' },
  { word: 'concise', category: 'tone', description: 'Length Modifier', tip: 'Eliminates filler — every sentence carries information.', color: '#a855f7' },
];

const TEMPLATES: Template[] = [
  { id: 'chain-of-thought', name: 'Chain of Thought', category: 'Analysis', preview: 'Think step by step about [problem]...', content: 'Think step by step about [problem]. First, identify the key variables. Then, walk through each stage of reasoning. Finally, present your conclusion with a brief justification for each step.' },
  { id: 'role-play', name: 'Role Play', category: 'Writing', preview: 'Act as an expert [role] with 20 years...', content: 'Act as an expert [role] with 20 years of experience. I need your advice on [topic]. Use your deep expertise to provide actionable, specific recommendations. Include examples from your career where relevant.' },
  { id: 'format-enforcer', name: 'Format Enforcer', category: 'Coding', preview: 'Respond ONLY in valid JSON...', content: 'Respond ONLY in valid JSON with these exact fields: "summary" (string), "steps" (array of strings), "confidence" (number 0-1). Do not include markdown formatting, explanations, or any text outside the JSON object.' },
  { id: 'critique-loop', name: 'Critique Loop', category: 'Analysis', preview: 'Write [thing]. Then critique it...', content: 'Write [thing]. Then critique your own work, identifying at least 3 weaknesses. Finally, rewrite it addressing each critique. Present all three versions labeled V1, Critique, and V2.' },
  { id: 'eli5', name: 'ELI5 Explainer', category: 'Education', preview: 'Explain [complex topic] as if...', content: 'Explain [complex topic] as if I\'m a curious 5-year-old. Use simple analogies from everyday life. Avoid jargon entirely. If you must use a technical term, define it immediately using a relatable comparison.' },
  { id: 'tabular', name: 'Tabular Comparison', category: 'Analysis', preview: 'Create a comparison table of [A] vs [B]...', content: 'Create a comparison table of [A] vs [B] with these columns: Feature, [A], [B], Winner. Include at least 8 rows covering price, performance, ease of use, support, scalability, integrations, security, and overall value.' },
];

const TIPS = [
  { icon: <Zap size={18} />, title: 'Be specific, not vague', content: '"Write a story" produces generic results. "Write a 500-word mystery story set in Victorian London with a unreliable narrator" gives the AI concrete constraints to work within. Specificity breeds quality.' },
  { icon: <Layers size={18} />, title: 'Use delimiters for structure', content: 'Triple quotes (\"\"\"), XML tags (<input>), and markdown headers help the AI parse complex prompts. Delimiters separate instructions from context from examples, reducing confusion.' },
  { icon: <BrainCircuit size={18} />, title: 'Give it a persona', content: '"Act as a senior developer" vs no role — the persona shapes tone, depth, and framing. A pediatrician explains vaccines differently than a research scientist.' },
  { icon: <Code size={18} />, title: 'Specify the format first', content: 'Ask for JSON, table, or list upfront rather than tacking it on at the end. Format declarations work best when placed early in the prompt.' },
  { icon: <ListOrdered size={18} />, title: 'Break complex tasks into steps', content: '"First do X, then Y, finally Z" — sequential instructions improve accuracy on multi-step reasoning. Each step acts as a checkpoint.' },
  { icon: <Lightbulb size={18} />, title: 'Ask for reasoning', content: '"Explain your thinking" or "Show your work" improves response quality. The AI generates better answers when it reasons aloud before concluding.' },
  { icon: <BookOpen size={18} />, title: 'Use examples (few-shot)', content: 'Provide 2-3 examples of desired output format. The AI will pattern-match and produce more consistent results. Examples beat instructions.' },
  { icon: <PenTool size={18} />, title: 'Set boundaries', content: '"Do not include..." / "Only use..." / "Avoid mentioning..." — negative constraints are just as important as positive ones. They prevent unwanted content.' },
];

const FORMAT_OPTIONS: { value: OutputFormat; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Plain Text', icon: <FileText size={16} /> },
  { value: 'markdown', label: 'Markdown', icon: <PenTool size={16} /> },
  { value: 'json', label: 'JSON', icon: <Code size={16} /> },
  { value: 'table', label: 'Table', icon: <Table size={16} /> },
  { value: 'list', label: 'Numbered List', icon: <ListOrdered size={16} /> },
];

/* ─────────────── Mock Response Generator ─────────────── */
function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function generateMockResponse(prompt: string, params: ParameterState): string {
  if (!prompt.trim()) return '';
  const hash = simpleHash(prompt + params.temperature + params.topP + params.maxTokens);
  const templates = [
    `Here's a thoughtful response to your request about "${prompt.slice(0, 40)}${prompt.length > 40 ? '...' : ''}".\n\nBased on the context you've provided, I'd recommend starting with a clear objective. Break down the problem into smaller components and address each one systematically. Consider edge cases and be prepared to iterate based on feedback.`,
    `Great question! Let me walk you through this step by step.\n\n1. First, understand the core requirements\n2. Gather relevant context and constraints\n3. Apply appropriate methodology\n4. Review and refine the output\n\nThe key insight here is that ${['clarity', 'specificity', 'context', 'structure', 'examples'][hash % 5]} matters most when crafting high-quality prompts.`,
    `I've analyzed your request and here are my findings:\n\n**Summary:** The task involves ${prompt.split(' ').slice(0, 6).join(' ')} and requires careful attention to detail.\n\n**Recommendations:**\n- Approach methodically\n- Validate assumptions early\n- Iterate based on results\n\nWould you like me to go deeper on any specific aspect?`,
    `💡 Idea Generation Mode Activated\n\nHere are several angles to explore:\n\n• Angle A: Focus on the practical applications\n• Angle B: Consider theoretical implications\n• Angle C: Look at historical precedents\n• Angle D: Examine future possibilities\n\nEach approach offers unique insights. My suggestion: start with Angle ${['A', 'B', 'C', 'D'][hash % 4]} for immediate impact.`,
    `As an expert in this domain, I would approach this as follows:\n\nThe fundamental principle to remember is that quality inputs produce quality outputs. When you provide rich context, clear constraints, and specific examples, the AI can leverage its training much more effectively.\n\nFor your specific case involving "${prompt.slice(0, 30)}...", I suggest refining the scope and adding one concrete example to anchor the response.`,
  ];
  let response = templates[hash % templates.length];

  // Temperature effects
  if (params.temperature <= 0.3) {
    response = response
      .replace(/great/gi, 'acceptable')
      .replace(/thoughtful/gi, 'standard')
      .replace(/careful/gi, 'basic')
      .replace(/recommend/gi, 'suggest')
      .replace(/several/gi, 'a few')
      .replace(/unique/gi, 'common');
    response += '\n\n[Low temperature: focused, conservative output]';
  } else if (params.temperature >= 0.9) {
    const creativeAdditions = [
      '\n\n🌟 Bonus insight: Consider looking at this from a completely orthogonal perspective!',
      '\n\n✨ Wild idea: What if we flipped the entire premise upside down?',
      '\n\n🔮 Future vision: In 10 years, this approach might seem quaint compared to what\'s coming.',
    ];
    response += creativeAdditions[hash % creativeAdditions.length];
    response += '\n[High temperature: creative, varied output]';
  }

  // Format effects
  if (params.format === 'json') {
    response = `{\n  "response": ${JSON.stringify(response.split('\n').join(' '))},\n  "confidence": ${(0.7 + (hash % 30) / 100).toFixed(2)},\n  "tokens_used": ${params.maxTokens > 200 ? params.maxTokens - 50 : params.maxTokens}\n}`;
  } else if (params.format === 'table') {
    response = `| Aspect | Details |\n|--------|---------|\n| Topic | ${prompt.slice(0, 30)}... |\n| Approach | ${['Systematic', 'Creative', 'Analytical', 'Pragmatic'][hash % 4]} |\n| Confidence | ${['High', 'Medium', 'Very High'][hash % 3]} |\n| Next Step | ${['Refine prompt', 'Add examples', 'Test variations'][hash % 3]} |\n\n${response}`;
  } else if (params.format === 'list') {
    const lines = response.split('\n').filter(l => l.trim());
    response = lines.map((l, i) => `${i + 1}. ${l}`).join('\n');
  }

  // Token truncation simulation
  const words = response.split(' ');
  const approxTokens = Math.floor(words.length * 1.3);
  if (approxTokens > params.maxTokens) {
    const keepWords = Math.floor(params.maxTokens / 1.3);
    response = words.slice(0, keepWords).join(' ') + '\n\n[... truncated by max_tokens limit]';
  }

  return response;
}

/* ─────────────── localStorage helpers ─────────────── */
const HISTORY_KEY = 'prompt-forge-lab-history';

function loadHistory(): PromptHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: PromptHistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)));
}

/* ─────────────── Easing constants ─────────────── */
const easeBreathe = [0.4, 0, 0.2, 1] as [number, number, number, number];
const easeAppear = [0, 0, 0.2, 1] as [number, number, number, number];

/* ─────────────── Sub-components ─────────────── */

function TooltipCard({ word, effect }: { word: string; effect: WordEffect }) {
  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] bg-cream rounded-[8px] shadow-md p-3 border border-stone-200 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-jetbrains text-sm font-medium" style={{ color: effect.color }}>
          {word}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-inter font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
          {effect.category}
        </span>
      </div>
      <p className="font-crimson text-sm text-stone-700 leading-relaxed">{effect.tip}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-cream rotate-45 border-r border-b border-stone-200" />
    </div>
  );
}

function HighlightedPrompt({ text, onWordHover }: { text: string; onWordHover?: (word: string | null) => void }) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  const parts = useMemo(() => {
    if (!text) return [];
    const result: { type: 'normal' | 'highlight'; content: string; effect?: WordEffect }[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      let earliestMatch: { index: number; length: number; effect: WordEffect } | null = null;

      for (const effect of WORD_EFFECTS) {
        const idx = remaining.toLowerCase().indexOf(effect.word.toLowerCase());
        if (idx !== -1 && (earliestMatch === null || idx < earliestMatch.index)) {
          earliestMatch = { index: idx, length: effect.word.length, effect };
        }
      }

      if (earliestMatch && earliestMatch.index === 0) {
        result.push({
          type: 'highlight',
          content: remaining.slice(0, earliestMatch.length),
          effect: earliestMatch.effect,
        });
        remaining = remaining.slice(earliestMatch.length);
      } else if (earliestMatch) {
        result.push({ type: 'normal', content: remaining.slice(0, earliestMatch.index) });
        result.push({
          type: 'highlight',
          content: remaining.slice(earliestMatch.index, earliestMatch.index + earliestMatch.length),
          effect: earliestMatch.effect,
        });
        remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
      } else {
        result.push({ type: 'normal', content: remaining });
        break;
      }
    }

    return result;
  }, [text]);

  return (
    <div className="font-jetbrains text-[0.9375rem] leading-relaxed text-moss-900 whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.type === 'normal') {
          return <span key={i}>{part.content}</span>;
        }
        const isHovered = hoveredWord === part.content.toLowerCase();
        return (
          <span
            key={i}
            className="relative inline cursor-help"
            onMouseEnter={() => {
              setHoveredWord(part.content.toLowerCase());
              onWordHover?.(part.content);
            }}
            onMouseLeave={() => {
              setHoveredWord(null);
              onWordHover?.(null);
            }}
          >
            <span
              className="border-b-2 border-dotted transition-all duration-200"
              style={{ borderColor: part.effect?.color, color: isHovered ? part.effect?.color : undefined }}
            >
              {part.content}
            </span>
            {isHovered && part.effect && (
              <TooltipCard word={part.content} effect={part.effect} />
            )}
          </span>
        );
      })}
    </div>
  );
}

function ParameterSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  description,
  emoji,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  description: string;
  emoji: string;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-inter text-sm font-medium text-stone-700 flex items-center gap-2">
          {emoji} {label}
        </label>
        <span className="font-jetbrains text-sm font-medium text-moss-700 bg-moss-50 px-2.5 py-1 rounded-md">
          {value}
        </span>
      </div>
      <div className="relative h-2 bg-stone-200 rounded-full">
        <div
          className="absolute h-full bg-moss-500 rounded-full transition-all duration-150"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-moss-600 rounded-full shadow-md border-2 border-white transition-all duration-150 hover:scale-125"
          style={{ left: `calc(${percent}% - 10px)` }}
        />
      </div>
      <p className="font-inter text-xs text-stone-500">{description}</p>
    </div>
  );
}

function ThermometerVisual({ value }: { value: number }) {
  const percent = (value / 2) * 100;
  const getColor = () => {
    if (value < 0.5) return '#3b82f6';
    if (value < 1.0) return '#6b9b6b';
    if (value < 1.5) return '#f59e0b';
    return '#ef4444';
  };
  return (
    <div className="flex items-center gap-3">
      <div className="w-4 h-32 bg-stone-200 rounded-full relative overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-500"
          style={{ height: `${percent}%`, backgroundColor: getColor() }}
        />
      </div>
      <div className="text-xs text-stone-500 font-inter space-y-1">
        <div>🔥 {value.toFixed(1)}</div>
        <div className="text-[10px] opacity-60">
          {value < 0.4 ? 'Focused' : value < 0.9 ? 'Balanced' : 'Creative'}
        </div>
      </div>
    </div>
  );
}

function TargetVisual({ value }: { value: number }) {
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  return (
    <div className="flex items-center justify-center py-2">
      <div className="relative w-28 h-28">
        {rings.map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full border-2 transition-all duration-500 flex items-center justify-center"
            style={{
              width: `${r * 100}%`,
              height: `${r * 100}%`,
              top: `${(1 - r) * 50}%`,
              left: `${(1 - r) * 50}%`,
              borderColor: value >= r ? '#5a855a' : '#e7e5e4',
              backgroundColor: value >= r && i === 0 ? 'rgba(90,133,90,0.1)' : 'transparent',
            }}
          >
            {i === 0 && value >= r && (
              <div className="w-3 h-3 rounded-full bg-moss-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RulerVisual({ value }: { value: number }) {
  const percent = ((value - 50) / (4000 - 50)) * 100;
  return (
    <div className="py-2">
      <div className="w-full h-6 bg-stone-200 rounded relative overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 h-full flex items-center justify-center">
              <div className="w-px h-2 bg-stone-300" />
            </div>
          ))}
        </div>
        <div
          className="absolute top-0 bottom-0 bg-moss-500/20 border-r-2 border-moss-600 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-stone-500 font-inter mt-1">
        <span>50</span>
        <span>1000</span>
        <span>2000</span>
        <span>4000</span>
      </div>
    </div>
  );
}

/* ─────────────── Main Page ─────────────── */
export default function PromptLab() {
  const [searchParams] = useSearchParams();
  const promptParam = searchParams.get('prompt') || '';

  const [prompt, setPrompt] = useState(promptParam);
  const [params, setParams] = useState<ParameterState>({
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 500,
    format: 'text',
  });
  const [preview, setPreview] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<PromptHistoryItem[]>(loadHistory);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced preview generation
  const triggerGeneration = useCallback(() => {
    if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
    if (!prompt.trim()) {
      setPreview('');
      setIsGenerating(false);
      return;
    }
    setIsGenerating(true);
    generateTimeoutRef.current = setTimeout(() => {
      const response = generateMockResponse(prompt, params);
      setPreview(response);
      setIsGenerating(false);
    }, 600);
  }, [prompt, params]);

  useEffect(() => {
    triggerGeneration();
    return () => {
      if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
    };
  }, [triggerGeneration]);

  // Save to history when prompt is submitted / simulated
  const saveToHistory = useCallback(() => {
    if (!prompt.trim()) return;
    const item: PromptHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      prompt: prompt.slice(0, 500),
      timestamp: Date.now(),
      params: { ...params },
    };
    const updated = [item, ...history].slice(0, 20);
    setHistory(updated);
    saveHistory(updated);
    toast.success('Prompt saved to history!');
  }, [prompt, params, history]);

  const loadTemplate = (template: Template) => {
    setPrompt(template.content);
    setSelectedTemplate(template.id);
    toast.success(`Template "${template.name}" loaded! Customize it above ✨`);
    textareaRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addWordToPrompt = (word: string) => {
    const newPrompt = prompt.trim() ? `${prompt.trim()} ${word}` : word;
    setPrompt(newPrompt);
    setExpandedWord(null);
    textareaRef.current?.focus();
    toast.success(`Added "${word}" to your prompt ✨`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 1500);
  };

  const sendToChatGPT = () => {
    const url = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
    window.open(url, '_blank');
  };

  const estimatedTokens = Math.floor(prompt.split(' ').length * 1.3);

  const wordEffectCards = WORD_EFFECTS.slice(0, 12);

  return (
    <div className="min-h-[100dvh]">
      {/* ── Hero ── */}
      <section
        className="relative bg-moss-900 text-center overflow-hidden"
        style={{
          paddingTop: 'clamp(6rem, 10vw, 8rem)',
          paddingBottom: 'clamp(3rem, 6vw, 4rem)',
        }}
      >
        <div
          className="absolute inset-0 opacity-15 bg-cover bg-center"
          style={{ backgroundImage: 'url(/prompt-lab-hero.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-moss-900/80 to-moss-900/95" />
        <div className="relative z-10 max-w-[900px] mx-auto px-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeBreathe }}
            className="font-inter text-xs font-medium tracking-[0.12em] uppercase text-moss-400 mb-4"
          >
            ⚗️ INTERACTIVE LAB
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: easeBreathe }}
            className="font-playfair text-cream font-bold leading-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            The Prompt Laboratory
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: easeBreathe }}
            className="font-inter text-lg text-moss-300 max-w-[600px] mx-auto mt-4 leading-relaxed"
          >
            Experiment with words, parameters, and phrasing. Watch how each change reshapes the AI's response — no API key required.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: easeBreathe }}
            onClick={() => document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-6 font-inter text-amber-300 hover:text-amber-100 transition-colors duration-200 underline underline-offset-4"
          >
            Start Building ↓
          </motion.button>
        </div>
      </section>

      {/* ── Prompt Builder ── */}
      <section id="builder" className="bg-stone-50 py-[clamp(2rem,5vw,4rem)]">
        <div className="max-w-[1200px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: easeAppear }}
            className="bg-stone-100 rounded-[16px] shadow-lg border border-stone-200 p-6 lg:p-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6 lg:gap-8">
              {/* Left: Input + Parameters */}
              <div className="space-y-5">
                {/* Prompt textarea */}
                <div>
                  <label className="font-inter text-sm font-medium text-stone-700 flex items-center gap-2 mb-2">
                    <PenTool size={16} className="text-moss-600" /> Your Prompt
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your prompt here... Try 'Write a story about a cat who learns to code'"
                    className="w-full min-h-[200px] bg-cream rounded-[8px] border border-stone-200 p-4 font-jetbrains text-[0.9375rem] text-moss-900 placeholder:text-stone-400 focus:outline-none focus:border-moss-400 focus:shadow-[0_0_40px_rgba(106,155,106,0.15)] transition-all duration-300 resize-y"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-inter text-xs text-stone-500">
                      ~{estimatedTokens} tokens estimated
                    </span>
                    <button
                      onClick={copyPrompt}
                      className="flex items-center gap-1.5 font-inter text-xs text-moss-600 hover:text-moss-800 transition-colors duration-200"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  {prompt.trim() && (
                    <div className="mt-3 p-3 bg-stone-50 rounded-[6px] border border-stone-200">
                      <p className="font-inter text-[10px] uppercase tracking-wider text-stone-500 mb-2">Word Effects Detected</p>
                      <HighlightedPrompt text={prompt} />
                    </div>
                  )}
                </div>

                {/* Parameters */}
                <div className="bg-moss-50 rounded-[8px] p-4 space-y-5">
                  <h3 className="font-inter text-sm font-semibold text-moss-800 flex items-center gap-2">
                    <Hash size={16} /> Parameters
                  </h3>
                  <ParameterSlider
                    label="Temperature"
                    value={params.temperature}
                    min={0}
                    max={2}
                    step={0.1}
                    onChange={(v) => setParams((p) => ({ ...p, temperature: v }))}
                    description="Lower = more focused, Higher = more random"
                    emoji={params.temperature < 0.5 ? '🧊' : params.temperature < 1.0 ? '🌡️' : '🔥'}
                  />
                  <ParameterSlider
                    label="Top-p"
                    value={params.topP}
                    min={0.1}
                    max={1}
                    step={0.05}
                    onChange={(v) => setParams((p) => ({ ...p, topP: v }))}
                    description="Nucleus sampling — lower = more conservative"
                    emoji="🎯"
                  />
                  <ParameterSlider
                    label="Max Tokens"
                    value={params.maxTokens}
                    min={50}
                    max={4000}
                    step={50}
                    onChange={(v) => setParams((p) => ({ ...p, maxTokens: v }))}
                    description="Output length limit (roughly 1 word ≈ 1.3 tokens)"
                    emoji="📏"
                  />
                </div>

                {/* Format selector */}
                <div>
                  <label className="font-inter text-sm font-medium text-stone-700 mb-2 block">
                    Output Format
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FORMAT_OPTIONS.map((fmt) => (
                      <button
                        key={fmt.value}
                        onClick={() => setParams((p) => ({ ...p, format: fmt.value }))}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-[8px] font-inter text-sm transition-all duration-200 ${
                          params.format === fmt.value
                            ? 'bg-moss-700 text-cream shadow-sm'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {fmt.icon}
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulate + Send buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={saveToHistory}
                    className="flex items-center gap-2 px-5 py-3 bg-moss-700 text-cream rounded-[14px] font-inter text-sm font-medium hover:bg-moss-800 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                  >
                    <Sparkles size={16} />
                    Simulate & Save
                  </button>
                  <button
                    onClick={sendToChatGPT}
                    className="flex items-center gap-2 px-5 py-3 bg-stone-200 text-stone-700 rounded-[14px] font-inter text-sm font-medium hover:bg-stone-300 transition-all duration-200"
                  >
                    <Send size={16} />
                    Send to ChatGPT
                  </button>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-inter text-sm font-semibold text-stone-700 flex items-center gap-2">
                    <Eye size={16} /> Live Preview
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-inter text-[10px] font-medium px-2 py-1 rounded bg-amber-100 text-amber-700">
                      Simulated
                    </span>
                    <button
                      onClick={triggerGeneration}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-moss-700 hover:bg-stone-100 transition-colors duration-200"
                      title="Regenerate preview"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <div className="bg-dark-bg rounded-[12px] p-5 min-h-[300px] relative overflow-hidden">
                  {isGenerating ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-moss-800/30 rounded w-3/4" />
                      <div className="h-4 bg-moss-800/30 rounded w-full" />
                      <div className="h-4 bg-moss-800/30 rounded w-5/6" />
                      <div className="h-4 bg-moss-800/30 rounded w-2/3" />
                      <div className="h-4 bg-moss-800/20 rounded w-4/5" />
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-2 h-4 bg-moss-500 animate-caret-blink" />
                        <span className="font-inter text-xs text-moss-400">Generating...</span>
                      </div>
                    </div>
                  ) : preview ? (
                    <div className="font-jetbrains text-[0.9375rem] text-dark-text leading-relaxed whitespace-pre-wrap">
                      {preview}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-dark-muted">
                      <FlaskConical size={32} className="mb-3 opacity-40" />
                      <p className="font-inter text-sm">
                        Type a prompt to see a simulated preview...
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-inter text-xs text-stone-500">
                    ~{Math.floor(preview.split(' ').length * 1.3)} tokens in preview
                  </span>
                </div>
              </div>
            </div>

            {/* Prompt History */}
            {history.length > 0 && (
              <div className="mt-8 pt-6 border-t border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-inter text-sm font-semibold text-stone-700 flex items-center gap-2">
                    <RotateCcw size={16} /> Recent Prompts
                  </h3>
                  <button
                    onClick={() => {
                      setHistory([]);
                      saveHistory([]);
                    }}
                    className="font-inter text-xs text-stone-500 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {history.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPrompt(item.prompt);
                        setParams(item.params);
                      }}
                      className="w-full text-left p-3 rounded-[8px] bg-stone-50 hover:bg-stone-200 border border-stone-200 transition-colors duration-200"
                    >
                      <p className="font-jetbrains text-sm text-moss-900 truncate">{item.prompt}</p>
                      <p className="font-inter text-[10px] text-stone-500 mt-1">
                        T:{item.params.temperature} · P:{item.params.topP} · {item.params.maxTokens}tk · {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Word Effect Explorer ── */}
      <section className="bg-cream py-[clamp(2rem,5vw,4rem)]">
        <div className="max-w-[1000px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: easeBreathe }}
            className="text-center mb-8"
          >
            <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-moss-900 flex items-center justify-center gap-2 mb-3">
              <Search size={24} /> Word Effect Explorer
            </h2>
            <p className="font-inter text-stone-500 max-w-[600px] mx-auto">
              Click any word to see how it shapes AI behavior. Add words to your prompt and watch the preview change.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wordEffectCards.map((effect, i) => (
              <motion.div
                key={effect.word}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: easeBreathe }}
                className={`bg-stone-100 rounded-[12px] border transition-all duration-200 cursor-pointer overflow-hidden ${
                  expandedWord === effect.word
                    ? 'border-moss-400 shadow-md'
                    : 'border-stone-200 hover:border-moss-300 hover:shadow-sm'
                }`}
                onClick={() => setExpandedWord(expandedWord === effect.word ? null : effect.word)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-jetbrains text-sm font-medium" style={{ color: effect.color }}>
                      {effect.word}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-inter font-medium px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                      {effect.category}
                    </span>
                  </div>
                  <p className="font-inter text-xs text-stone-500">{effect.description}</p>

                  <AnimatePresence>
                    {expandedWord === effect.word && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: easeBreathe }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-stone-200">
                          <p className="font-crimson text-sm text-stone-700 leading-relaxed mb-3">
                            {effect.tip}
                          </p>
                          <div className="bg-stone-50 rounded-[6px] p-3 mb-3">
                            <p className="font-inter text-[10px] uppercase text-stone-500 mb-1">Before</p>
                            <p className="font-jetbrains text-xs text-stone-600 line-through opacity-60">
                              {effect.word === 'creative' ? 'Write a story about a dragon.' : `Write about ${effect.word}...`}
                            </p>
                            <p className="font-inter text-[10px] uppercase text-stone-500 mt-2 mb-1">After</p>
                            <p className="font-jetbrains text-xs text-moss-800">
                              {effect.word === 'creative' ? 'Write a creative, imaginative story about a dragon with unexpected twists.' : `Write using "${effect.word}" to shape the output.`}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addWordToPrompt(effect.word);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-moss-700 text-cream rounded-[6px] font-inter text-xs font-medium hover:bg-moss-800 hover:scale-105 transition-all duration-200"
                          >
                            <Plus size={12} /> Add to Prompt
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Parameter Playground ── */}
      <section className="bg-stone-50 py-[clamp(2rem,5vw,4rem)]">
        <div className="max-w-[900px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: easeBreathe }}
            className="text-center mb-8"
          >
            <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-moss-900 flex items-center justify-center gap-2 mb-3">
              <Terminal size={24} /> Parameter Playground
            </h2>
            <p className="font-inter text-stone-500">
              Understand the dials that control AI behavior
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Temperature Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0, ease: easeBreathe }}
              className="bg-stone-100 rounded-[12px] shadow-sm p-6 border border-stone-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <Thermometer size={20} className="text-moss-600" />
                <h3 className="font-inter text-base font-semibold text-moss-900">Temperature</h3>
              </div>
              <ThermometerVisual value={params.temperature} />
              <div className="mt-4 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={params.temperature}
                  onChange={(e) => setParams((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
                  className="w-full accent-moss-600"
                />
                <div className="bg-stone-50 rounded-[6px] p-3 mt-3">
                  <p className="font-inter text-xs text-stone-500 mb-1">Sample effect:</p>
                  <p className="font-jetbrains text-xs text-stone-600">
                    {params.temperature < 0.4
                      ? 'The cat sat on the mat. The cat was happy. The mat was soft.'
                      : params.temperature < 0.9
                      ? 'The orange tabby curled up on the worn kitchen mat, purring contentedly.'
                      : 'A quantum-tunneling feline materialized on an interdimensional mat, contemplating string theory while licking its paw.'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Top-p Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.15, ease: easeBreathe }}
              className="bg-stone-100 rounded-[12px] shadow-sm p-6 border border-stone-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target size={20} className="text-moss-600" />
                <h3 className="font-inter text-base font-semibold text-moss-900">Top-p</h3>
              </div>
              <TargetVisual value={params.topP} />
              <div className="mt-4 space-y-2">
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={params.topP}
                  onChange={(e) => setParams((p) => ({ ...p, topP: parseFloat(e.target.value) }))}
                  className="w-full accent-moss-600"
                />
                <p className="font-inter text-xs text-stone-500 mt-2">
                  At {params.topP.toFixed(2)}, the AI considers the top {(params.topP * 100).toFixed(0)}% most likely words.
                </p>
                <div className="bg-stone-50 rounded-[6px] p-3 mt-2">
                  <p className="font-inter text-xs text-stone-500 mb-1">Vocabulary diversity:</p>
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: Math.floor(params.topP * 10) + 2 }).map((_, i) => (
                      <span key={i} className="font-jetbrains text-[10px] px-1.5 py-0.5 bg-moss-100 text-moss-700 rounded">
                        word{i + 1}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Max Tokens Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.3, ease: easeBreathe }}
              className="bg-stone-100 rounded-[12px] shadow-sm p-6 border border-stone-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <Ruler size={20} className="text-moss-600" />
                <h3 className="font-inter text-base font-semibold text-moss-900">Max Tokens</h3>
              </div>
              <RulerVisual value={params.maxTokens} />
              <div className="mt-4 space-y-2">
                <input
                  type="range"
                  min={50}
                  max={4000}
                  step={50}
                  value={params.maxTokens}
                  onChange={(e) => setParams((p) => ({ ...p, maxTokens: parseInt(e.target.value) }))}
                  className="w-full accent-moss-600"
                />
                <p className="font-inter text-xs text-stone-500 mt-2">
                  Current limit: ~{Math.floor(params.maxTokens / 1.3)} words
                </p>
                <div className="bg-stone-50 rounded-[6px] p-3 mt-2">
                  <p className="font-inter text-xs text-stone-500 mb-1">Truncation preview:</p>
                  <p className="font-jetbrains text-xs text-stone-600">
                    {params.maxTokens < 200
                      ? 'Short output. Only key points fit...'
                      : params.maxTokens < 1000
                      ? 'Medium output. Good for summaries and brief explanations...'
                      : 'Long output. Room for detailed analysis, examples, and nuance...'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Templates Gallery ── */}
      <section className="bg-cream py-[clamp(2rem,5vw,4rem)]">
        <div className="max-w-[1200px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: easeBreathe }}
            className="text-center mb-8"
          >
            <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-moss-900 flex items-center justify-center gap-2 mb-3">
              <FileText size={24} /> Prompt Templates
            </h2>
            <p className="font-inter text-stone-500">
              Start from proven prompts. Click to load into the builder above.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((template, i) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: easeBreathe }}
                className={`bg-stone-100 rounded-[12px] p-5 border transition-all duration-200 ${
                  selectedTemplate === template.id
                    ? 'border-moss-400 shadow-md'
                    : 'border-stone-200 hover:-translate-y-1 hover:shadow-lg hover:border-moss-300'
                }`}
              >
                <span className="inline-block font-inter text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-moss-100 text-moss-700 mb-3">
                  {template.category}
                </span>
                <h3 className="font-inter text-base font-semibold text-moss-900 mb-2">
                  {template.name}
                </h3>
                <p className="font-jetbrains text-xs text-stone-500 mb-4 line-clamp-2">
                  {template.preview}
                </p>
                <button
                  onClick={() => loadTemplate(template)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-moss-50 text-moss-700 rounded-[8px] font-inter text-sm font-medium hover:bg-moss-100 transition-colors duration-200"
                >
                  <Plus size={14} /> Load into Builder
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tips & Best Practices ── */}
      <section className="bg-stone-50 py-[clamp(2rem,5vw,4rem)]">
        <div className="max-w-[800px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: easeBreathe }}
            className="text-center mb-8"
          >
            <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-moss-900 flex items-center justify-center gap-2 mb-3">
              <Lightbulb size={24} /> Prompt Engineering Tips
            </h2>
          </motion.div>

          <AccordionPrimitive.Root type="multiple" className="space-y-3">
            {TIPS.map((tip, i) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: easeBreathe }}
              >
                <AccordionPrimitive.Item value={`tip-${i}`} className="bg-stone-100 rounded-[12px] border border-stone-200 overflow-hidden">
                  <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger className="w-full flex items-center justify-between p-4 text-left group">
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-moss-50 text-moss-600">
                          {tip.icon}
                        </span>
                        <span className="font-inter text-sm font-semibold text-moss-900 group-hover:text-moss-700 transition-colors">
                          {tip.title}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className="text-stone-500 transition-transform duration-300 group-data-[state=open]:rotate-180"
                      />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Content className="overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    <div className="px-4 pb-4 pl-[3.25rem]">
                      <p className="font-crimson text-sm text-stone-700 leading-relaxed">
                        {tip.content}
                      </p>
                    </div>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              </motion.div>
            ))}
          </AccordionPrimitive.Root>
        </div>
      </section>
    </div>
  );
}
