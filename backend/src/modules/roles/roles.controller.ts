import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Roles y Permisos')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Crear un nuevo rol personalizado con permisos iniciales' })
  async create(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('permissionIds') permissionIds?: string[],
  ) {
    if (!name || !name.trim()) {
      throw new BadRequestException('El nombre del rol es requerido');
    }
    return this.rolesService.create(
      name.trim(),
      description || '',
      permissionIds || [],
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los roles configurados' })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Listar todos los permisos del sistema' })
  async findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Put(':id/permissions')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Actualizar la asignación de permisos de un rol' })
  async updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissionIds') permissionIds: string[],
  ) {
    return this.rolesService.updateRolePermissions(id, permissionIds || []);
  }
}
