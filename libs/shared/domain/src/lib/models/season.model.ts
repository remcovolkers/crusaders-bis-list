export interface ISeasonConfig {
  id: string;
  raidSeasonId: string;
  trinketLimit: number;
  weaponLimit: number;
  jewelryLimit: number;
  armorLimit: number;
  superrareLimit: number;
}

export interface UpdateSeasonConfigDto {
  trinketLimit: number;
  weaponLimit: number;
  jewelryLimit: number;
  armorLimit: number;
  superrareLimit: number;
}
