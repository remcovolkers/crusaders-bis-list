import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WowClass, WowSpec, RaiderStatus } from '@crusaders-bis-list/shared-domain';
import { UserOrmEntity } from './user.orm-entity';

@Entity('raider_profiles')
export class RaiderProfileOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;

  @Column({ name: 'character_name' })
  characterName!: string;

  @Column({ nullable: true, default: '' })
  realm!: string;

  @Column({ name: 'wow_class', type: 'varchar' })
  wowClass!: WowClass;

  @Column({ type: 'varchar' })
  spec!: WowSpec;

  @Column({ type: 'varchar', default: RaiderStatus.ACTIVE })
  status!: RaiderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
