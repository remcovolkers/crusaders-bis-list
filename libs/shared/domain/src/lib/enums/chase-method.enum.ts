/**
 * How a raider hopes to get a chased item:
 *  - BOSS_DROP: from the boss' loot (the raider is in the raid when it drops).
 *  - BONUS_ROLL: from a bonus roll after the kill (a personal roll that can give an item of the boss' loot table on a
 *    higher difficulty, e.g. a Heroic kill that rolls a Myth item). Whether bonus rolls exist is a season setting.
 */
export enum ChaseMethod {
  BOSS_DROP = 'boss_drop',
  BONUS_ROLL = 'bonus_roll',
}
