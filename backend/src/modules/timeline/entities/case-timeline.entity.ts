import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Case } from '../../cases/entities/case.entity';
import { User } from '../../users/entities/user.entity';

@Entity('case_timeline')
export class CaseTimeline {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ length: 60 })
  eventType: string; // 'ESTADO_CAMBIADO', 'ASIGNACION', 'ANALISIS_ACTUALIZADO', 'RESPUESTA_PUBLICADA', 'COMENTARIO'

  @Column({ length: 100, nullable: true })
  fromValue: string;

  @Column({ length: 100, nullable: true })
  toValue: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  isInternalOnly: boolean;

  @ManyToOne(() => Case, (caseItem) => caseItem.timeline, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ name: 'case_id', type: 'uuid' })
  caseId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performed_by_id' })
  performedBy: User;

  @Column({ name: 'performed_by_id', type: 'uuid', nullable: true })
  performedById?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
