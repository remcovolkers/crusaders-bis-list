import { ArmorType } from '../enums/armor-type.enum';
import { CLASS_ARMOR_TYPE } from '../enums/wow-data';
import { WowClass } from '../enums/wow-class.enum';
import { WowSpec } from '../enums/wow-spec.enum';
import { IItem } from '../models';

/**
 * Single source of truth for item eligibility per class/spec.
 * - Armor items: matched via CLASS_ARMOR_TYPE (armorType field, not category).
 * - Non-armor items (armorType = NONE): available to all classes.
 */
export function canClassReserveItem(wowClass: WowClass, _spec: WowSpec, item: IItem): boolean {
  if (item.armorType === ArmorType.NONE) return true;
  return CLASS_ARMOR_TYPE[wowClass] === item.armorType;
}
