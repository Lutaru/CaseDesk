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

@Entity('case_technical_analyses')
export class CaseTechnicalAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  rootCauseSummary: string; // Resumen de causa raíz identificada

  @Column({ type: 'text', nullable: true })
  reproductionSteps: string; // Pasos para reproducir

  @Column({ type: 'jsonb', nullable: true })
  affectedObjects: {
    tables?: string[];
    storedProcedures?: string[];
    views?: string[];
    controllers?: string[];
  };

  @Column({ type: 'text', nullable: true })
  diagnosticQueriesSql: string; // Consultas SQL de diagnóstico

  @Column({ type: 'text', nullable: true })
  hypothesesAndFindings: string; // Hipótesis y hallazgos detallados

  @Column({ type: 'text', nullable: true })
  risksAndDependencies: string; // Riesgos e impacto colateral

  @Column({ type: 'int', default: 1 })
  version: number;

  @OneToOne(() => Case, (caseItem) => caseItem.technicalAnalysis, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ name: 'case_id', type: 'uuid' })
  caseId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'last_modified_by_id' })
  lastModifiedBy: User;

  @Column({ name: 'last_modified_by_id', type: 'uuid', nullable: true })
  lastModifiedById?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
