export interface RollEvent {
  type: 'tick' | 'winner' | 'waiting';
  name: string;
  raiderId?: string;
}

export interface RollSessionInfo {
  sessionId: string;
  itemName: string;
  itemIconUrl?: string;
  secondaryIconUrl?: string;
  difficulty?: string;
  raiders: { raiderId: string; name: string; color?: string }[];
  status: 'waiting' | 'rolling' | 'done';
}
