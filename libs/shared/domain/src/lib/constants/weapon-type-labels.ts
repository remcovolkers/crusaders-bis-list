import { WeaponType } from '../enums/weapon-type.enum';

export const WEAPON_TYPE_LABELS: Record<WeaponType, string> = {
  [WeaponType.AXE_1H]: 'One-Hand Axe',
  [WeaponType.AXE_2H]: 'Two-Hand Axe',
  [WeaponType.BOW]: 'Bow',
  [WeaponType.CROSSBOW]: 'Crossbow',
  [WeaponType.DAGGER]: 'Dagger',
  [WeaponType.FIST]: 'Fist Weapon',
  [WeaponType.GUN]: 'Gun',
  [WeaponType.MACE_1H]: 'One-Hand Mace',
  [WeaponType.MACE_2H]: 'Two-Hand Mace',
  [WeaponType.POLEARM]: 'Polearm',
  [WeaponType.SHIELD]: 'Shield',
  [WeaponType.STAFF]: 'Staff',
  [WeaponType.SWORD_1H]: 'One-Hand Sword',
  [WeaponType.SWORD_2H]: 'Two-Hand Sword',
  [WeaponType.WAND]: 'Wand',
  [WeaponType.WARGLAIVE]: 'Warglaive',
  [WeaponType.OTHER]: 'Weapon',
};
