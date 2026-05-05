export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  joinedAt: string;
  avatar: string;
}

export const users: User[] = [
  {
    id: 'u1',
    username: 'xsytrance',
    email: 'admin@promptforge.dev',
    password_hash: 'mock_hash',
    joinedAt: '2026-01-01',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xsytrance',
  },
  {
    id: 'u2',
    username: 'greenThumb',
    email: 'green@example.com',
    password_hash: 'mock_hash',
    joinedAt: '2026-01-20',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=greenThumb',
  },
  {
    id: 'u3',
    username: 'promptWizard',
    email: 'wizard@example.com',
    password_hash: 'mock_hash',
    joinedAt: '2026-02-01',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=promptWizard',
  },
  {
    id: 'u4',
    username: 'aiGardener',
    email: 'gardener@example.com',
    password_hash: 'mock_hash',
    joinedAt: '2026-02-10',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aiGardener',
  },
  {
    id: 'u5',
    username: 'forgeMaster',
    email: 'master@example.com',
    password_hash: 'mock_hash',
    joinedAt: '2026-02-15',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=forgeMaster',
  },
];
