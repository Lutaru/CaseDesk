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
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Módulo de Clientes')
@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @RequirePermissions('clients:view')
  @ApiOperation({ summary: 'Listar todos los clientes' })
  async findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('clients:view')
  @ApiOperation({ summary: 'Consultar detalle de un cliente con conexiones de BD' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @RequirePermissions('clients:manage')
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  async create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('clients:manage')
  @ApiOperation({ summary: 'Actualizar datos de un cliente' })
  async update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @RequirePermissions('clients:manage')
  @ApiOperation({ summary: 'Activar o desactivar cliente' })
  async toggleActive(@Param('id') id: string) {
    return this.clientsService.toggleActive(id);
  }
}
