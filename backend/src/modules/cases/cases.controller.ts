import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import {
  CreateCaseDto,
  UpdateCaseStatusDto,
  UpdateCaseTechnicalAnalysisDto,
  UpdateCaseSolutionDto,
  UpdateCaseClientResponseDto,
  AddTimelineCommentDto,
  CaseQueryDto,
} from './dto/case.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Gestión de Casos Técnicos')
@Controller('cases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get('metrics/summary')
  @ApiOperation({ summary: 'Obtener métricas y KPIs del Dashboard' })
  async getMetrics() {
    return this.casesService.getMetrics();
  }

  @Get()
  @ApiOperation({ summary: 'Listar y filtrar casos técnicos' })
  async findAll(@Query() query: CaseQueryDto) {
    return this.casesService.findAll(query);
  }

  @Get(':idOrCode')
  @ApiOperation({ summary: 'Consultar detalle completo de un caso por UUID o Código (ej. CASO-00226)' })
  async findOne(@Param('idOrCode') idOrCode: string) {
    return this.casesService.findOne(idOrCode);
  }

  @Post()
  @RequirePermissions('cases:create')
  @ApiOperation({ summary: 'Crear un nuevo caso técnico' })
  async create(
    @Body() dto: CreateCaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.casesService.create(dto, userId);
  }

  @Patch(':id/status')
  @RequirePermissions('cases:change_status_dev')
  @ApiOperation({ summary: 'Actualizar estado del caso' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCaseStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.casesService.updateStatus(id, dto, userId);
  }

  @Put(':id/analysis')
  @RequirePermissions('cases:edit_technical')
  @ApiOperation({ summary: 'Guardar o actualizar análisis técnico interno' })
  async updateTechnicalAnalysis(
    @Param('id') id: string,
    @Body() dto: UpdateCaseTechnicalAnalysisDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.casesService.updateTechnicalAnalysis(id, dto, userId);
  }

  @Put(':id/solution')
  @RequirePermissions('cases:edit_technical')
  @ApiOperation({ summary: 'Guardar o actualizar solución técnica y scripts' })
  async updateSolution(
    @Param('id') id: string,
    @Body() dto: UpdateCaseSolutionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.casesService.updateSolution(id, dto, userId);
  }

  @Put(':id/client-response')
  @RequirePermissions('cases:publish_response')
  @ApiOperation({ summary: 'Guardar borrador o publicar respuesta oficial al cliente' })
  async updateClientResponse(
    @Param('id') id: string,
    @Body() dto: UpdateCaseClientResponseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.casesService.updateClientResponse(id, dto, userId);
  }

  @Post(':id/timeline')
  @ApiOperation({ summary: 'Agregar un comentario o evento a la línea de tiempo del caso' })
  async addTimelineComment(
    @Param('id') id: string,
    @Body() dto: AddTimelineCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.casesService.addTimelineComment(id, dto, userId);
  }
}
