import { DataSource } from 'typeorm';
import { RaidSeasonOrmEntity, BossOrmEntity, ItemOrmEntity } from '../entities/catalog.orm-entity';

/**
 * Seed: Liberation of Undermine — The War Within Season 2
 * Items are categorised as trinket, weapon, or other.
 * isPrioritizable = true for trinkets and weapons (reservable by raiders).
 */
export async function seedRaidCatalog(dataSource: DataSource): Promise<void> {
  const seasonRepo = dataSource.getRepository(RaidSeasonOrmEntity);
  const bossRepo = dataSource.getRepository(BossOrmEntity);
  const itemRepo = dataSource.getRepository(ItemOrmEntity);

  const existing = await seasonRepo.findOne({ where: { slug: 'tww-s2-undermine' } });
  if (existing) return; // Already seeded

  const season = await seasonRepo.save(
    seasonRepo.create({
      name: 'The War Within – Liberation of Undermine',
      slug: 'tww-s2-undermine',
      isActive: true,
      startDate: new Date('2025-02-25'),
    }),
  );

  const bossData: { name: string; order: number; items: { name: string; wowItemId?: number; category: string; isPrioritizable: boolean }[] }[] = [
    {
      name: 'Vexie and the Geargrinders',
      order: 1,
      items: [
        { name: 'Geargrinder\'s Spare Tire', wowItemId: 224076, category: 'trinket', isPrioritizable: true },
        { name: 'Overclocked Gearsprocket', wowItemId: 224082, category: 'weapon', isPrioritizable: true },
        { name: 'Turbo-Charged Chainmail Chestguard', wowItemId: 224058, category: 'other', isPrioritizable: false },
      ],
    },
    {
      name: 'Cauldron of Carnage',
      order: 2,
      items: [
        { name: 'Vial of Caustic Brew', wowItemId: 224097, category: 'trinket', isPrioritizable: true },
        { name: 'Frenzied Fleshgorer', wowItemId: 224103, category: 'weapon', isPrioritizable: true },
        { name: 'Carnage-Forged Pauldrons', wowItemId: 224088, category: 'other', isPrioritizable: false },
      ],
    },
    {
      name: 'Rik Reverb',
      order: 3,
      items: [
        { name: 'Resonating Amp Shard', wowItemId: 224119, category: 'trinket', isPrioritizable: true },
        { name: 'Feedback Loop Conductor', wowItemId: 224125, category: 'weapon', isPrioritizable: true },
        { name: 'Soundwave-Shattered Bracers', wowItemId: 224110, category: 'other', isPrioritizable: false },
      ],
    },
    {
      name: 'Stix Bunkjunker',
      order: 4,
      items: [
        { name: 'Junk Magnetron Trinket', wowItemId: 224140, category: 'trinket', isPrioritizable: true },
        { name: 'Scrap-Heap Shredder', wowItemId: 224146, category: 'weapon', isPrioritizable: true },
        { name: 'Bunkjunker\'s Patched Vest', wowItemId: 224131, category: 'other', isPrioritizable: false },
      ],
    },
    {
      name: 'Sprocketmonger Lockenstock',
      order: 5,
      items: [
        { name: 'Volatile Sprocket Trinket', wowItemId: 224162, category: 'trinket', isPrioritizable: true },
        { name: 'Lockenstock\'s Chain Driver', wowItemId: 224168, category: 'weapon', isPrioritizable: true },
        { name: 'Sprocket-Studded Legplates', wowItemId: 224153, category: 'other', isPrioritizable: false },
      ],
    },
    {
      name: 'The One-Armed Bandit',
      order: 6,
      items: [
        { name: 'Jackpot Chip Trinket', wowItemId: 224183, category: 'trinket', isPrioritizable: true },
        { name: 'Bandit\'s Lucky Cleaver', wowItemId: 224189, category: 'weapon', isPrioritizable: true },
        { name: 'One-Armed Bandit\'s Cowl', wowItemId: 224174, category: 'other', isPrioritizable: false },
      ],
    },
    {
      name: 'Mug\'Zee, Heads of Security',
      order: 7,
      items: [
        { name: 'Dual-Head Security Badge', wowItemId: 224205, category: 'trinket', isPrioritizable: true },
        { name: 'Mugzee\'s Enforcement Baton', wowItemId: 224211, category: 'weapon', isPrioritizable: true },
        { name: 'Head of Security Mantle', wowItemId: 224196, category: 'other', isPrioritizable: false },
      ],
    },
    {
      name: 'Chrome King Gallywix',
      order: 8,
      items: [
        { name: 'Gallywix\'s Gilded Inductor', wowItemId: 224226, category: 'trinket', isPrioritizable: true },
        { name: 'Gallywix\'s Personal Sidearm', wowItemId: 224232, category: 'weapon', isPrioritizable: true },
        { name: 'Chrome-Plated Shoulderguards', wowItemId: 224217, category: 'other', isPrioritizable: false },
      ],
    },
  ];

  for (const bossInfo of bossData) {
    const boss = await bossRepo.save(
      bossRepo.create({
        name: bossInfo.name,
        raidSeasonId: season.id,
        order: bossInfo.order,
      }),
    );

    for (const itemInfo of bossInfo.items) {
      await itemRepo.save(
        itemRepo.create({
          name: itemInfo.name,
          wowItemId: itemInfo.wowItemId,
          category: itemInfo.category,
          bossId: boss.id,
          isPrioritizable: itemInfo.isPrioritizable,
        }),
      );
    }
  }
}
