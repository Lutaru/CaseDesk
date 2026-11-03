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

@Entity('case_solutions')
export class CaseSolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  solutionSummary: string; // Explicación de la solución técnica implementada

  @Column({ type: 'jsonb', nullable: true })
  modifiedComponents: {
    files?: string[];
    storedProcedures?: string[];
    tables?: string[];
  };

  @Column({ type: 'text', nullable: true })
  solutionScriptSql: string; // Script SQL de corrección/migración

  @Column({ type: 'text', nullable: true })
  implementationSteps: string; // Pasos ordenados de despliegue

  @Column({ type: 'text', nullable: true })
  rollbackProcedure: string; // Plan de reversión si falla

  @Column({ length: 50, default: 'DESARROLLO' })
  validationEnvironment: string; // DEV, QA, PROD

  @Column({ type: 'text', nullable: true })
  testResults: string; // Resultados de pruebas ejecutadas

  @OneToOne(() => Case, (caseItem) => caseItem.solution, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ name: 'case_id', type: 'uuid' })
  caseId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'tested_by_id' })
  testedBy: User;

  @Column({ name: 'tested_by_id', type: 'uuid', nullable: true })
  testedById?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
