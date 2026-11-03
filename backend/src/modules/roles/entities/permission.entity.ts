import { Entity, PrimaryColumn, Column, ManyToMany } from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryColumn({ length: 80 })
  id: string; // ej: 'cases:create', 'cases:edit_technical'

  @Column({ length: 60 })
  module: string; // ej: 'CASOS', 'CLIENTES', 'CONEXIONES'

  @Column({ length: 255 })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
