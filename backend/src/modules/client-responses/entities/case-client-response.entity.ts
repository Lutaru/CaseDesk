import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Case } from '../../cases/entities/case.entity';
import { User } from '../../users/entities/user.entity';
import { ClientResponseStatus } from '../../../common/enums';

@Entity('case_client_responses')
export class CaseClientResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  issueSummaryClient: string; // Resumen del inconveniente reportado

  @Column({ type: 'text', nullable: true })
  causeExplainedClient: string; // Explicación sencilla de la causa

  @Column({ type: 'text' })
  actionTakenClient: string; // Solución aplicada o acciones tomadas

  @Column({ type: 'text', nullable: true })
  pendingClientActions: string; // Si requiere validación o pasos por parte del cliente

  @Column({ type: 'text', nullable: true })
  recommendations: string; // Recomendaciones preventivas

  @Column({
    type: 'enum',
    enum: ClientResponseStatus,
    default: ClientResponseStatus.BORRADOR,
  })
  status: ClientResponseStatus;

  @OneToOne(() => Case, (caseItem) => caseItem.clientResponse, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ name: 'case_id', type: 'uuid' })
  caseId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'published_by_id' })
  publishedBy: User;

  @Column({ name: 'published_by_id', type: 'uuid', nullable: true })
  publishedById?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
