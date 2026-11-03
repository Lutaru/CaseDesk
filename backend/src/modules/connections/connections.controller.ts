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
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto, UpdateConnectionDto } from './dto/connection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Conexiones a Bases de Datos')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ConnectionsController {
  constructor(private readonly connService: ConnectionsService) {}

  @Get('clients/:clientId/connections')
  @RequirePermissions('connections:manage')
  @ApiOperation({ summary: 'Listar las conexiones de base de datos de un cliente' })
  async findByClient(@Param('clientId') clientId: string) {
    return this.connService.findAllByClient(clientId);
  }

  @Get('connections/:id')
  @RequirePermissions('connections:manage')
  @ApiOperation({ summary: 'Consultar detalle de una conexión' })
  async findOne(@Param('id') id: string) {
    return this.connService.findOne(id);
  }

  @Post('clients/:clientId/connections')
  @RequirePermissions('connections:manage')
  @ApiOperation({ summary: 'Registrar una nueva conexión con credenciales cifradas (AES-256)' })
  async create(
    @Param('clientId') clientId: string,
    @Body() dto: CreateConnectionDto,
  ) {
    return this.connService.create(clientId, dto);
  }

  @Patch('connections/:id')
  @RequirePermissions('connections:manage')
  @ApiOperation({ summary: 'Actualizar configuración de una conexión' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateConnectionDto,
  ) {
    return this.connService.update(id, dto);
  }

  @Post('connections/:id/test')
  @RequirePermissions('connections:test')
  @ApiOperation({ summary: 'Probar conectividad y latencia de una conexión registrada' })
  async testConnection(@Param('id') id: string) {
    return this.connService.testConnection(id);
  }
}
