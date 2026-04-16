export interface RollEvent {
  type: 'tick' | 'winner' | 'waiting';
  name: string;
  raiderId?: string;
}

export interface RollSessionInfo {
  sessionId: string;
  itemName: string;
  itemIconUrl?: string;
  raiders: { raiderId: string; name: string }[];
  status: 'waiting' | 'rolling' | 'done';
}
