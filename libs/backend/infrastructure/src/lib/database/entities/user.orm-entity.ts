import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole, Team } from '@crusaders-bis-list/shared-domain';

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'google_id', nullable: true })
  googleId!: string;

  @Column({ name: 'bnet_id', type: 'varchar', nullable: true, unique: true })
  bnetId!: string | null;

  @Column({ name: 'battletag', type: 'varchar', nullable: true })
  battletag!: string | null;

  @Column({ name: 'bnet_access_token', type: 'text', nullable: true })
  bnetAccessToken!: string | null;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'simple-array', default: UserRole.RAIDER })
  roles!: UserRole[];

  @Column({ name: 'team', type: 'varchar', default: Team.CRUSADERS })
  team!: Team;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
