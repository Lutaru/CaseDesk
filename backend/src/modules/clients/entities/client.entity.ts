import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { ClientDbConnection } from '../../connections/entities/client-db-connection.entity';
import { User } from '../../users/entities/user.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 30 })
  code: string; // ej: 'CLI-001'

  @Column({ length: 150 })
  businessName: string; // ej: 'SOMEDYT S.A.S.'

  @Column({ length: 30, nullable: true })
  taxId: string; // ej: '806016797'

  @Column({ length: 100, nullable: true })
  contactName: string;

  @Column({ length: 120, nullable: true })
  contactEmail: string;

  @Column({ length: 50, nullable: true })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ClientDbConnection, (connection) => connection.client, {
    cascade: true,
  })
  dbConnections: ClientDbConnection[];

  @ManyToMany(() => User, (user) => user.authorizedClients)
  authorizedUsers: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
