import { apiFetch } from './api-client';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  isMe: boolean;
}

export interface LeaderboardResponse {
  board: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  tab: 'weekly' | 'alltime';
  weekStart?: string;
}

export async function fetchLeaderboard(tab: 'weekly' | 'alltime'): Promise<LeaderboardResponse> {
  const res = await apiFetch(`/api/leaderboard?tab=${tab}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load leaderboard');
  return data;
}
