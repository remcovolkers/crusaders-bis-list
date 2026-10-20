import { RaidDifficulty } from '../enums/raid-difficulty.enum';

/** Item-tier tone used to colour a raid difficulty in the UI (maps onto `--tier-<tone>` / `.badge-<tone>`). */
export type DifficultyTone = 'champion' | 'hero' | 'myth';

/** Normal -> champion, Heroic -> hero, Mythic -> myth. */
export function difficultyTone(difficulty: RaidDifficulty | string): DifficultyTone {
  switch (difficulty) {
    case RaidDifficulty.MYTHIC:
      return 'myth';
    case RaidDifficulty.HEROIC:
      return 'hero';
    default:
      return 'champion';
  }
}
