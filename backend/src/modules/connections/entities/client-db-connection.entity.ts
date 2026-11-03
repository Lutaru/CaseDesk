import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { DatabaseEngine, EnvironmentType } from '../../../common/enums';

@Entity('client_db_connections')
export class ClientDbConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string; // ej: 'Servidor Principal Contabilidad (Producción)'

  @Column({
    type: 'enum',
    enum: DatabaseEngine,
    default: DatabaseEngine.MSSQL,
  })
  engine: DatabaseEngine;

  @Column({ length: 150 })
  host: string; // IP o hostname

  @Column({ type: 'int', default: 1433 })
  port: number;

  @Column({ length: 100, nullable: true })
  instanceName: string; // ej: 'SISMA'

  @Column({ length: 100 })
  databaseName: string; // ej: 'SismaContabilidad'

  @Column({ length: 100 })
  username: string;

  // Credenciales cifradas con AES-256-GCM
  @Column({ type: 'text', select: false })
  encryptedPasswordHex: string;

  @Column({ type: 'varchar', length: 64, select: false })
  encryptionIvHex: string;

  @Column({ type: 'varchar', length: 64, select: false })
  encryptionAuthTagHex: string;

  @Column({
    type: 'enum',
    enum: EnvironmentType,
    default: EnvironmentType.PRODUCCION,
  })
  environment: EnvironmentType;

  @Column({ default: true })
  isReadOnly: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastTestedAt: Date;

  @Column({ type: 'boolean', nullable: true })
  lastTestStatus: boolean;

  @Column({ type: 'text', nullable: true })
  lastTestMessage: string;

  @ManyToOne(() => Client, (client) => client.dbConnections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
