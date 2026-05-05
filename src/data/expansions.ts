export interface Expansion {
  id: string;
  parentBountyId: string;
  authorId: string;
  title: string;
  description: string;
  createdAt: string;
  likes: number;
}

export const expansions: Expansion[] = [
  {
    id: 'exp-1',
    parentBountyId: '1',
    authorId: 'u2',
    title: 'Browser Extension Companion',
    description: 'Extended the Free Stuff Scraper into a Chrome extension that adds a popup for quick scanning and desktop notifications when new offers appear.',
    createdAt: '2026-01-25',
    likes: 12,
  },
  {
    id: 'exp-2',
    parentBountyId: '2',
    authorId: 'u3',
    title: 'Notion Agent Bridge',
    description: 'Built a specific agent bridge for Notion that can read databases, create pages, and update properties through natural language commands.',
    createdAt: '2026-01-28',
    likes: 18,
  },
  {
    id: 'exp-3',
    parentBountyId: '2',
    authorId: 'u4',
    title: 'Figma Design Agent',
    description: 'Created an agent that can query Figma files, extract design tokens, and suggest component improvements based on design system rules.',
    createdAt: '2026-02-01',
    likes: 9,
  },
  {
    id: 'exp-4',
    parentBountyId: '4',
    authorId: 'u5',
    title: 'Multi-Platform Analytics Dashboard',
    description: 'Added a unified analytics view that aggregates metrics from all connected social platforms with AI-generated insights and recommendations.',
    createdAt: '2026-02-03',
    likes: 15,
  },
  {
    id: 'exp-5',
    parentBountyId: '5',
    authorId: 'u2',
    title: 'Auto-Subtitle Generator Add-on',
    description: 'Extended the video pipeline to auto-generate subtitles in multiple languages using Whisper and overlay them on the final video.',
    createdAt: '2026-02-05',
    likes: 21,
  },
  {
    id: 'exp-6',
    parentBountyId: '8',
    authorId: 'u3',
    title: 'Wikipedia Atlas Connector',
    description: 'Built a connector that automatically populates the knowledge atlas from Wikipedia pages with live updates when articles change.',
    createdAt: '2026-02-08',
    likes: 11,
  },
  {
    id: 'exp-7',
    parentBountyId: '11',
    authorId: 'u4',
    title: 'Hermes Evaluation Suite',
    description: 'Created a benchmark suite to compare the Hermes clone against the original on helpfulness, harmlessness, and honesty metrics.',
    createdAt: '2026-02-14',
    likes: 14,
  },
  {
    id: 'exp-8',
    parentBountyId: '12',
    authorId: 'u5',
    title: 'Mobile App Companion',
    description: 'Built a React Native companion app for the bounty board with push notifications and offline browsing support.',
    createdAt: '2026-02-18',
    likes: 23,
  },
];
