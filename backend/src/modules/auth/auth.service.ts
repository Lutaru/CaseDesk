import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoinAndSelect('user.authorizedClients', 'client')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('El usuario se encuentra inactivo');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar fecha de último acceso
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Compilar permisos únicos de todos los roles asignados
    const permissionsSet = new Set<string>();
    const rolesList: string[] = [];

    user.roles?.forEach((role) => {
      rolesList.push(role.name);
      role.permissions?.forEach((perm) => {
        permissionsSet.add(perm.id);
      });
    });

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: rolesList,
      permissions: Array.from(permissionsSet),
      authorizedClients: user.authorizedClients?.map((c) => c.id) || [],
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: rolesList,
        permissions: Array.from(permissionsSet),
        authorizedClients: user.authorizedClients?.map((c) => ({
          id: c.id,
          businessName: c.businessName,
        })),
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'authorizedClients'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const permissionsSet = new Set<string>();
    const rolesList: string[] = [];

    user.roles?.forEach((role) => {
      rolesList.push(role.name);
      role.permissions?.forEach((perm) => {
        permissionsSet.add(perm.id);
      });
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      roles: rolesList,
      permissions: Array.from(permissionsSet),
      authorizedClients: user.authorizedClients?.map((c) => ({
        id: c.id,
        businessName: c.businessName,
      })),
    };
  }
}
