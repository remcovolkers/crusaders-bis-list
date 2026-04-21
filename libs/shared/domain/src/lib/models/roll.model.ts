export interface SpectatorInfo {
  displayName: string;
}

export interface RollEvent {
  type: 'tick' | 'winner' | 'waiting' | 'spectators';
  name: string;
  raiderId?: string;
  spectators?: SpectatorInfo[];
}

export interface RollSessionInfo {
  sessionId: string;
  itemName: string;
  itemIconUrl?: string;
  secondaryIconUrl?: string;
  difficulty?: string;
  raiders: { raiderId: string; name: string; color?: string }[];
  status: 'waiting' | 'rolling' | 'done';
  spectators: SpectatorInfo[];
  winner?: { raiderId: string; name: string } | null;
}
