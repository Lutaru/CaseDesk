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

@Entity('case_attachments')
export class CaseAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  originalFilename: string;

  @Column({ length: 255, select: false })
  storagePathHash: string; // Ruta interna en disco o identificador UUID

  @Column({ length: 20 })
  fileExtension: string; // .xlsx, .sql, .png, .log, etc.

  @Column({ type: 'bigint' })
  fileSizeBytes: number;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ default: true })
  isInternalOnly: boolean; // Si true, el cliente no lo ve

  @ManyToOne(() => Case, (caseItem) => caseItem.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column()
  caseId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;

  @Column()
  uploadedById: string;

  @CreateDateColumn()
  createdAt: Date;
}
