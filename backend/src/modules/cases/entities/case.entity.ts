import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { CaseTechnicalAnalysis } from '../../technical-analysis/entities/case-technical-analysis.entity';
import { CaseSolution } from '../../solutions/entities/case-solution.entity';
import { CaseClientResponse } from '../../client-responses/entities/case-client-response.entity';
import { CaseAttachment } from '../../attachments/entities/case-attachment.entity';
import { CaseTimeline } from '../../timeline/entities/case-timeline.entity';
import { CasePriority, CaseStatus, CaseType } from '../../../common/enums';

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ unique: true, length: 30 })
  code: string; // ej: 'CASO-2026-00227'

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  descriptionRaw: string;

  @Column({ length: 60, default: 'Contabilidad' })
  affectedSystem: string; // 'Contabilidad', 'Inventario', 'Nómina', etc.

  @Column({ length: 80, nullable: true })
  affectedModule: string; // 'Circular 016', 'Entrada Mercancía', 'Cierre de Año'

  @Column({
    type: 'enum',
    enum: CaseType,
    default: CaseType.ERROR,
  })
  caseType: CaseType;

  @Column({
    type: 'enum',
    enum: CasePriority,
    default: CasePriority.MEDIA,
  })
  priority: CasePriority;

  @Column({
    type: 'enum',
    enum: CaseStatus,
    default: CaseStatus.REGISTRADO,
  })
  status: CaseStatus;

  @ManyToOne(() => Client, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User;

  @Column({ name: 'assigned_to_id', type: 'uuid', nullable: true })
  assignedToId?: string | null;

  @OneToOne(() => CaseTechnicalAnalysis, (analysis) => analysis.case, {
    cascade: true,
  })
  technicalAnalysis: CaseTechnicalAnalysis;

  @OneToOne(() => CaseSolution, (solution) => solution.case, {
    cascade: true,
  })
  solution: CaseSolution;

  @OneToOne(() => CaseClientResponse, (response) => response.case, {
    cascade: true,
  })
  clientResponse: CaseClientResponse;

  @OneToMany(() => CaseAttachment, (attachment) => attachment.case, {
    cascade: true,
  })
  attachments: CaseAttachment[];

  @OneToMany(() => CaseTimeline, (timeline) => timeline.case, {
    cascade: true,
  })
  timeline: CaseTimeline[];

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;
}
