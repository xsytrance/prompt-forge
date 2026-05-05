export type InteractionType = 'like' | 'bookmark' | 'complete';

export interface UserInteraction {
  userId: string;
  bountyId: string;
  type: InteractionType;
  timestamp: string;
}

export const interactions: UserInteraction[] = [
  { userId: 'u2', bountyId: '1', type: 'like', timestamp: '2026-01-16' },
  { userId: 'u3', bountyId: '1', type: 'bookmark', timestamp: '2026-01-17' },
  { userId: 'u2', bountyId: '2', type: 'like', timestamp: '2026-01-19' },
  { userId: 'u4', bountyId: '2', type: 'like', timestamp: '2026-01-20' },
  { userId: 'u3', bountyId: '2', type: 'bookmark', timestamp: '2026-01-21' },
  { userId: 'u5', bountyId: '2', type: 'complete', timestamp: '2026-02-01' },
  { userId: 'u2', bountyId: '4', type: 'like', timestamp: '2026-01-23' },
  { userId: 'u4', bountyId: '4', type: 'like', timestamp: '2026-01-24' },
  { userId: 'u3', bountyId: '4', type: 'bookmark', timestamp: '2026-01-25' },
  { userId: 'u2', bountyId: '5', type: 'like', timestamp: '2026-01-26' },
  { userId: 'u4', bountyId: '5', type: 'bookmark', timestamp: '2026-01-27' },
  { userId: 'u5', bountyId: '5', type: 'like', timestamp: '2026-02-02' },
  { userId: 'u2', bountyId: '6', type: 'like', timestamp: '2026-01-29' },
  { userId: 'u3', bountyId: '6', type: 'complete', timestamp: '2026-02-05' },
  { userId: 'u4', bountyId: '8', type: 'like', timestamp: '2026-02-06' },
  { userId: 'u5', bountyId: '8', type: 'bookmark', timestamp: '2026-02-07' },
  { userId: 'u2', bountyId: '11', type: 'like', timestamp: '2026-02-13' },
  { userId: 'u4', bountyId: '11', type: 'like', timestamp: '2026-02-14' },
  { userId: 'u3', bountyId: '12', type: 'like', timestamp: '2026-02-16' },
  { userId: 'u4', bountyId: '12', type: 'bookmark', timestamp: '2026-02-17' },
  { userId: 'u5', bountyId: '12', type: 'like', timestamp: '2026-02-18' },
];
