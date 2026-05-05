export type Difficulty = 'easy' | 'medium' | 'hard';
export type PromptLevel = 'beginner' | 'intermediate' | 'advanced';
export type BountyStatus = 'new' | 'inprogress' | 'completed';

export interface Prompt {
  level: PromptLevel;
  text: string;
}

export interface WordEffect {
  word: string;
  explanation: string;
  alternative: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  parentId?: string;
}

export interface Expansion {
  id: string;
  parentBountyId: string;
  authorId: string;
  title: string;
  description: string;
  createdAt: string;
  likes: number;
}

export interface Bounty {
  id: string;
  title: string;
  emoji: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  estimatedTime: string;
  tools: string[];
  prompts: Prompt[];
  wordEffects: WordEffect[];
  author: string;
  createdAt: string;
  views: number;
  likes: number;
  comments: Comment[];
  expansions: string[];
  status: BountyStatus;
}

export const bounties: Bounty[] = [
  {
    id: '1',
    title: 'Free Stuff Scraper Agent',
    emoji: '🤖',
    description: 'Build an agent that scrapes websites for free offers, samples, and giveaways. Automatically aggregates free stuff listings and notifies users of new opportunities.',
    difficulty: 'medium',
    tags: ['scraping', 'automation', 'notifications'],
    estimatedTime: '2-3 days',
    tools: ['Puppeteer', 'Node.js', 'OpenAI API'],
    prompts: [
      { level: 'beginner', text: 'Create a simple web scraper that finds free stuff listings on a website. Extract the title, description, and link for each offer.' },
      { level: 'intermediate', text: 'Build a scraper agent that monitors multiple websites for free offers, categorizes them by type (samples, trials, giveaways), and stores them in a database with timestamps.' },
      { level: 'advanced', text: 'Develop an autonomous agent that discovers free offer sites, scrapes them intelligently handling pagination and JavaScript rendering, deduplicates offers, and sends personalized notifications to users based on their preferences.' },
    ],
    wordEffects: [
      { word: 'autonomous', explanation: 'Implies the agent runs without human intervention', alternative: 'semi-automated' },
      { word: 'intelligently', explanation: 'Suggests adaptive behavior based on page structure', alternative: 'systematically' },
    ],
    author: 'xsytrance',
    createdAt: '2026-01-15',
    views: 342,
    likes: 28,
    comments: [],
    expansions: ['exp-1'],
    status: 'new',
  },
  {
    id: '2',
    title: 'Agentify Popular Apps',
    emoji: '📱',
    description: 'Transform popular web applications into agent-accessible interfaces. Create wrapper APIs and agent-friendly frontends for tools like Notion, Trello, and Figma.',
    difficulty: 'hard',
    tags: ['API', 'integration', 'agents'],
    estimatedTime: '1-2 weeks',
    tools: ['FastAPI', 'Playwright', 'LangChain'],
    prompts: [
      { level: 'beginner', text: 'Write a prompt that instructs an AI to interact with a simple web form and extract the results.' },
      { level: 'intermediate', text: 'Design an agent that can navigate a complex web app, authenticate via API keys, and perform CRUD operations on user data.' },
      { level: 'advanced', text: 'Architect a universal agent gateway that exposes any web app as an LLM-compatible tool with schema discovery, authentication handling, and rate limiting.' },
    ],
    wordEffects: [
      { word: 'universal', explanation: 'Implies one solution works for all apps', alternative: 'adaptable' },
      { word: 'gateway', explanation: 'Suggests a central entry point with controlled access', alternative: 'interface' },
    ],
    author: 'xsytrance',
    createdAt: '2026-01-18',
    views: 512,
    likes: 45,
    comments: [],
    expansions: ['exp-2', 'exp-3'],
    status: 'new',
  },
  {
    id: '3',
    title: 'Zapier Cascade Automation',
    emoji: '⚡',
    description: 'Build multi-step cascade automations using Zapier-style logic. Chain triggers and actions with conditional branching, loops, and error handling.',
    difficulty: 'medium',
    tags: ['automation', 'zapier', 'workflow'],
    estimatedTime: '3-5 days',
    tools: ['Zapier', 'n8n', 'Python'],
    prompts: [
      { level: 'beginner', text: 'Create a simple two-step zap: when a new email arrives, save the attachment to Google Drive.' },
      { level: 'intermediate', text: 'Build a cascade workflow that triggers on form submission, validates data, routes to different teams based on content, and logs everything to a central spreadsheet.' },
      { level: 'advanced', text: 'Design a self-healing automation cascade with retry logic, fallback paths, circuit breakers, and real-time monitoring dashboard.' },
    ],
    wordEffects: [
      { word: 'self-healing', explanation: 'Suggests the system recovers from failures automatically', alternative: 'resilient' },
      { word: 'cascade', explanation: 'Implies a waterfall of dependent operations', alternative: 'pipeline' },
    ],
    author: 'xsytrance',
    createdAt: '2026-01-20',
    views: 289,
    likes: 22,
    comments: [],
    expansions: [],
    status: 'new',
  },
  {
    id: '4',
    title: 'Social Media Manager Agent',
    emoji: '📱',
    description: 'Create an agent that manages social media presence across platforms. Schedules posts, responds to comments, analyzes engagement, and suggests content strategies.',
    difficulty: 'medium',
    tags: ['social-media', 'marketing', 'scheduling'],
    estimatedTime: '4-6 days',
    tools: ['Buffer API', 'OpenAI API', 'Analytics API'],
    prompts: [
      { level: 'beginner', text: 'Write a prompt that generates 5 social media post ideas for a coffee shop.' },
      { level: 'intermediate', text: 'Build an agent that drafts posts, schedules them across Twitter and Instagram, and tracks basic engagement metrics.' },
      { level: 'advanced', text: 'Create an autonomous social media manager that monitors trends, generates platform-optimized content, engages with followers in brand voice, and adjusts strategy based on performance analytics.' },
    ],
    wordEffects: [
      { word: 'autonomous', explanation: 'Implies self-directed operation without oversight', alternative: 'automated' },
      { word: 'brand voice', explanation: 'Suggests consistent personality across all content', alternative: 'tone' },
    ],
    author: 'xsytrance',
    createdAt: '2026-01-22',
    views: 567,
    likes: 51,
    comments: [],
    expansions: ['exp-4'],
    status: 'new',
  },
  {
    id: '5',
    title: 'Video Generator Integration',
    emoji: '🎬',
    description: 'Integrate AI video generation APIs into a cohesive workflow. Script writing, scene generation, voiceover, and final video assembly with one prompt.',
    difficulty: 'hard',
    tags: ['video', 'AI-generation', 'media'],
    estimatedTime: '1-2 weeks',
    tools: ['Runway API', 'ElevenLabs', 'FFmpeg'],
    prompts: [
      { level: 'beginner', text: 'Write a script for a 30-second explainer video about how photosynthesis works.' },
      { level: 'intermediate', text: 'Build a pipeline that takes a topic, generates a script, creates scene descriptions, and produces individual video segments using AI tools.' },
      { level: 'advanced', text: 'Develop a complete video generation system that accepts a topic and style preference, autonomously writes scripts, generates scenes, synthesizes voiceover, adds music, and renders a polished final video.' },
    ],
    wordEffects: [
      { word: 'autonomously', explanation: 'Implies no human intervention at any step', alternative: 'automatically' },
      { word: 'polished', explanation: 'Suggests professional-grade final output', alternative: 'finished' },
    ],
    author: 'xsytrance',
    createdAt: '2026-01-25',
    views: 623,
    likes: 67,
    comments: [],
    expansions: ['exp-5'],
    status: 'new',
  },
  {
    id: '6',
    title: 'App Icon Pack Generator',
    emoji: '🎨',
    description: 'Generate complete app icon packs with consistent style. Creates all required sizes and formats for iOS, Android, and web apps from a single description.',
    difficulty: 'easy',
    tags: ['design', 'icons', 'generator'],
    estimatedTime: '1-2 days',
    tools: ['DALL-E API', 'ImageMagick', 'Sharp'],
    prompts: [
      { level: 'beginner', text: 'Generate a simple app icon for a weather app using an AI image generator.' },
      { level: 'intermediate', text: 'Create a script that generates app icons in multiple sizes (512, 256, 128, 64, 32px) maintaining visual quality at each resolution.' },
      { level: 'advanced', text: 'Build an icon pack generator that creates cohesive themed icons for an entire app suite, handles adaptive icons for Android, app icon masking for iOS, and exports to all required formats.' },
    ],
    wordEffects: [
      { word: 'cohesive', explanation: 'Suggests visual unity across all icons', alternative: 'matching' },
      { word: 'adaptive', explanation: 'Implies dynamic shape handling for different devices', alternative: 'responsive' },
    ],
    author: 'xsytrance',
    createdAt: '2026-01-28',
    views: 445,
    likes: 38,
    comments: [],
    expansions: [],
    status: 'new',
  },
  {
    id: '7',
    title: 'Study MCP Protocol',
    emoji: '🔌',
    description: 'Deep dive into the Model Context Protocol (MCP). Build a reference implementation that connects LLMs to external data sources and tools using the protocol.',
    difficulty: 'easy',
    tags: ['protocol', 'MCP', 'research'],
    estimatedTime: '2-3 days',
    tools: ['TypeScript', 'Node.js', 'SSE'],
    prompts: [
      { level: 'beginner', text: 'Explain the Model Context Protocol in simple terms and list its key components.' },
      { level: 'intermediate', text: 'Implement a basic MCP server that exposes a simple calculator tool and a notes database to connected clients.' },
      { level: 'advanced', text: 'Build a production-ready MCP gateway with authentication, resource discovery, streaming context updates, and support for multiple transport protocols.' },
    ],
    wordEffects: [
      { word: 'production-ready', explanation: 'Implies enterprise-grade reliability and security', alternative: 'robust' },
      { word: 'gateway', explanation: 'Suggests a central hub for all MCP connections', alternative: 'server' },
    ],
    author: 'xsytrance',
    createdAt: '2026-02-01',
    views: 378,
    likes: 29,
    comments: [],
    expansions: [],
    status: 'new',
  },
  {
    id: '8',
    title: 'Atlas for Agents',
    emoji: '🗺️',
    description: 'Create a knowledge atlas that agents can query for structured information. A semantic map of concepts, entities, and relationships optimized for LLM retrieval.',
    difficulty: 'medium',
    tags: ['knowledge-graph', 'RAG', 'semantic'],
    estimatedTime: '5-7 days',
    tools: ['Neo4j', 'LangChain', 'Vector DB'],
    prompts: [
      { level: 'beginner', text: 'Create a simple knowledge base with 10 facts about space exploration formatted for easy retrieval.' },
      { level: 'intermediate', text: 'Build a semantic atlas that stores entities and relationships in a graph database with vector embeddings for similarity search.' },
      { level: 'advanced', text: 'Develop an intelligent knowledge atlas that self-organizes information, discovers implicit relationships, and answers complex multi-hop queries with cited sources.' },
    ],
    wordEffects: [
      { word: 'self-organizes', explanation: 'Implies automatic categorization without manual tagging', alternative: 'auto-categorizes' },
      { word: 'multi-hop', explanation: 'Suggests reasoning across multiple connected facts', alternative: 'complex' },
    ],
    author: 'xsytrance',
    createdAt: '2026-02-05',
    views: 412,
    likes: 35,
    comments: [],
    expansions: ['exp-6'],
    status: 'new',
  },
  {
    id: '9',
    title: 'Agent Schedule System',
    emoji: '⏰',
    description: 'Build a scheduling system where agents can book, reschedule, and manage appointments. Natural language interface for calendar operations.',
    difficulty: 'easy',
    tags: ['scheduling', 'calendar', 'NLP'],
    estimatedTime: '2-3 days',
    tools: ['Google Calendar API', 'Node.js', 'OpenAI API'],
    prompts: [
      { level: 'beginner', text: 'Write a prompt that converts "Meeting tomorrow at 3pm with Sarah" into structured calendar event data.' },
      { level: 'intermediate', text: 'Create an agent that can read calendar availability, suggest meeting times, and book events using natural language commands.' },
      { level: 'advanced', text: 'Build an intelligent scheduling agent that handles timezone conversions, conflict resolution, priority-based rescheduling, and multi-party availability optimization.' },
    ],
    wordEffects: [
      { word: 'intelligent', explanation: 'Suggests smart decision-making beyond simple rules', alternative: 'smart' },
      { word: 'optimization', explanation: 'Implies finding the mathematically best solution', alternative: 'coordination' },
    ],
    author: 'xsytrance',
    createdAt: '2026-02-08',
    views: 356,
    likes: 31,
    comments: [],
    expansions: [],
    status: 'new',
  },
  {
    id: '10',
    title: 'The Bob Method Research',
    emoji: '🔄',
    description: 'Research and document the "Bob Method" for prompt engineering. A technique for getting better AI responses by framing queries in a specific conversational style.',
    difficulty: 'easy',
    tags: ['research', 'prompt-engineering', 'methodology'],
    estimatedTime: '1-2 days',
    tools: ['ChatGPT', 'Documentation'],
    prompts: [
      { level: 'beginner', text: 'Research what the "Bob Method" is in prompt engineering and summarize your findings in 3 bullet points.' },
      { level: 'intermediate', text: 'Document the Bob Method with examples showing before/after prompts and explain why the technique improves response quality.' },
      { level: 'advanced', text: 'Conduct a systematic study of the Bob Method: test it across multiple models and prompt types, measure response quality improvements, and publish a comprehensive guide with reproducible results.' },
    ],
    wordEffects: [
      { word: 'systematic', explanation: 'Suggests rigorous, methodical approach', alternative: 'structured' },
      { word: 'reproducible', explanation: 'Implires others can get the same results', alternative: 'repeatable' },
    ],
    author: 'xsytrance',
    createdAt: '2026-02-10',
    views: 298,
    likes: 24,
    comments: [],
    expansions: [],
    status: 'new',
  },
  {
    id: '11',
    title: 'Hermes GPT Clone',
    emoji: '💬',
    description: 'Build a local clone of the Hermes conversational model. Fine-tune or prompt-engineer a base model to replicate its helpful, harmless, honest behavior.',
    difficulty: 'hard',
    tags: ['LLM', 'fine-tuning', 'local'],
    estimatedTime: '1-2 weeks',
    tools: ['Ollama', 'PyTorch', 'Hugging Face'],
    prompts: [
      { level: 'beginner', text: 'Set up a local LLM using Ollama and test it with 5 prompts to see how it responds.' },
      { level: 'intermediate', text: 'Create a prompt template system that wraps user inputs with system instructions to make a base model behave more like Hermes.' },
      { level: 'advanced', text: 'Fine-tune a base model on Hermes-style conversation datasets, implement custom token handling, and evaluate against the original on safety and helpfulness benchmarks.' },
    ],
    wordEffects: [
      { word: 'fine-tune', explanation: 'Suggests specialized training beyond base model', alternative: 'adapt' },
      { word: 'benchmarks', explanation: 'Implies measurable, comparable evaluation criteria', alternative: 'tests' },
    ],
    author: 'xsytrance',
    createdAt: '2026-02-12',
    views: 534,
    likes: 48,
    comments: [],
    expansions: ['exp-7'],
    status: 'new',
  },
  {
    id: '12',
    title: 'This Bounty Board',
    emoji: '🎯',
    description: 'Build a bounty board web application for tracking AI project ideas. Features include idea submission, difficulty ratings, progress tracking, and community voting.',
    difficulty: 'medium',
    tags: ['web-app', 'full-stack', 'community'],
    estimatedTime: '5-7 days',
    tools: ['React', 'Node.js', 'MongoDB'],
    prompts: [
      { level: 'beginner', text: 'Design the database schema for a simple bounty board with ideas, users, and votes.' },
      { level: 'intermediate', text: 'Build a React frontend for the bounty board with list view, detail view, voting buttons, and a submission form.' },
      { level: 'advanced', text: 'Create a full-featured bounty platform with real-time updates, gamification, reputation system, AI-powered difficulty estimation, and community moderation tools.' },
    ],
    wordEffects: [
      { word: 'gamification', explanation: 'Suggests game-like rewards and progression', alternative: 'engagement' },
      { word: 'real-time', explanation: 'Implies instant updates across all clients', alternative: 'live' },
    ],
    author: 'xsytrance',
    createdAt: '2026-02-15',
    views: 678,
    likes: 72,
    comments: [],
    expansions: ['exp-8'],
    status: 'new',
  },
];
