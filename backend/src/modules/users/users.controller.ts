import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Gestión de Usuarios')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Listar todos los usuarios del sistema' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Consultar detalle de un usuario' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Registrar un nuevo usuario con roles' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Actualizar información o roles de un usuario' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Activar o desactivar usuario' })
  async toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
