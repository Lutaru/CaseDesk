import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async create(
    name: string,
    description: string,
    permissionIds: string[] = [],
  ): Promise<Role> {
    const existing = await this.roleRepo.findOneBy({ name });
    if (existing) {
      throw new ConflictException(`El rol "${name}" ya existe`);
    }
    const permissions =
      permissionIds.length > 0
        ? await this.permissionRepo.findBy({ id: In(permissionIds) })
        : [];
    const role = this.roleRepo.create({
      name,
      description,
      isSystemRole: false,
      permissions,
    });
    return this.roleRepo.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({
      relations: ['permissions'],
      order: { id: 'ASC' },
    });
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find({
      order: { module: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    return role;
  }

  async updateRolePermissions(
    roleId: number,
    permissionIds: string[],
  ): Promise<Role> {
    const role = await this.findOne(roleId);
    const permissions = await this.permissionRepo.findBy({
      id: In(permissionIds),
    });
    role.permissions = permissions;
    return this.roleRepo.save(role);
  }
}
