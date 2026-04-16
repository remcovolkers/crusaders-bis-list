import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('feedback')
export class FeedbackOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'user_email' })
  userEmail!: string;

  @Column({ name: 'user_name' })
  userName!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'page_context' })
  pageContext!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ default: false })
  resolved!: boolean;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;
}
