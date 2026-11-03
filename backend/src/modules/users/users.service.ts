import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      relations: ['roles', 'authorizedClients'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles', 'authorizedClients'],
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existingUsername = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está registrado');
    }

    const existingEmail = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
      isActive: true,
    });

    if (dto.roleIds && dto.roleIds.length > 0) {
      user.roles = await this.roleRepo.findBy({ id: In(dto.roleIds) });
    }

    if (dto.authorizedClientIds && dto.authorizedClientIds.length > 0) {
      user.authorizedClients = await this.clientRepo.findBy({
        id: In(dto.authorizedClientIds),
      });
    }

    return this.userRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.email !== undefined && dto.email !== user.email) {
      const existing = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('El correo ya está en uso');
      user.email = dto.email;
    }
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(dto.password, salt);
    }

    if (dto.roleIds !== undefined) {
      user.roles = await this.roleRepo.findBy({ id: In(dto.roleIds) });
    }

    if (dto.authorizedClientIds !== undefined) {
      user.authorizedClients = await this.clientRepo.findBy({
        id: In(dto.authorizedClientIds),
      });
    }

    return this.userRepo.save(user);
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    return this.userRepo.save(user);
  }
}
