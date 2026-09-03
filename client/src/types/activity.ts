export interface ActivityFeedItem {
  id: string;
  type: 'CRIME' | 'CASINO' | 'BOUNTY' | 'TRAIN' | 'HOSPITAL' | 'JAIL' | 'BANK' | 'SYSTEM' | 'LEVEL' | 'MARKET' | 'FACTION';
  tag: string;
  message: string;
  timestamp: string;
  color?: string;
}

export const ACTIVITY_TYPES = [
  'CRIME',
  'CASINO',
  'BOUNTY',
  'TRAIN',
  'HOSPITAL',
  'JAIL',
  'BANK',
  'SYSTEM',
  'LEVEL',
  'MARKET',
  'FACTION',
] as const;
