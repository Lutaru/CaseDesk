import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CasePriority,
  CaseStatus,
  CaseType,
  ClientResponseStatus,
} from '../../../common/enums';

export class CreateCaseDto {
  @ApiProperty({ example: 'Descuadre entre Reporte FT003 y Libro Anexo CXC' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Se reporta una diferencia al comparar el informe de Circular 016...' })
  @IsString()
  @IsNotEmpty()
  descriptionRaw: string;

  @ApiProperty({ example: 'Contabilidad' })
  @IsString()
  @IsNotEmpty()
  affectedSystem: string;

  @ApiPropertyOptional({ example: 'Circular 016' })
  @IsString()
  @IsOptional()
  affectedModule?: string;

  @ApiProperty({ example: 'client-uuid-here' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({ enum: CaseType, example: CaseType.ERROR })
  @IsEnum(CaseType)
  @IsOptional()
  caseType?: CaseType;

  @ApiPropertyOptional({ enum: CasePriority, example: CasePriority.ALTA })
  @IsEnum(CasePriority)
  @IsOptional()
  priority?: CasePriority;

  @ApiPropertyOptional({ example: 'user-uuid-here' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}

export class UpdateCaseStatusDto {
  @ApiProperty({ enum: CaseStatus, example: CaseStatus.ANALIZANDO })
  @IsEnum(CaseStatus)
  status: CaseStatus;

  @ApiPropertyOptional({ example: 'Iniciando revisión de stored procedures en producción' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class UpdateCaseTechnicalAnalysisDto {
  @ApiPropertyOptional({ example: 'El procedimiento valida atributos = 2 ignorando cuentas 13 sin parametrizar' })
  @IsString()
  @IsOptional()
  rootCauseSummary?: string;

  @ApiPropertyOptional({ example: '1. Generar reporte FT003 a corte 31/12/2025. 2. Comparar con Anexo.' })
  @IsString()
  @IsOptional()
  reproductionSteps?: string;

  @ApiPropertyOptional({
    example: {
      tables: ['causacion', 'plan_de_cuenta'],
      storedProcedures: ['Sp_Rpt_Cricular016', 'saldo_facturas'],
    },
  })
  @IsOptional()
  affectedObjects?: {
    tables?: string[];
    storedProcedures?: string[];
    views?: string[];
    controllers?: string[];
  };

  @ApiPropertyOptional({ example: 'SELECT * FROM causacion WHERE cuenta LIKE \'13%\';' })
  @IsString()
  @IsOptional()
  diagnosticQueriesSql?: string;

  @ApiPropertyOptional({ example: 'Se descarta corrupción física en índices; es desfase de filtros.' })
  @IsString()
  @IsOptional()
  hypothesesAndFindings?: string;

  @ApiPropertyOptional({ example: 'No ejecutar en horario de facturación masiva por bloqueos en causacion.' })
  @IsString()
  @IsOptional()
  risksAndDependencies?: string;
}

export class UpdateCaseSolutionDto {
  @ApiProperty({ example: 'Se parametrizan atributos y se reclasifican saldos huérfanos' })
  @IsString()
  @IsNotEmpty()
  solutionSummary: string;

  @ApiPropertyOptional({
    example: {
      storedProcedures: ['Sp_Rpt_Cricular016'],
      tables: ['plan_de_cuenta'],
    },
  })
  @IsOptional()
  modifiedComponents?: {
    files?: string[];
    storedProcedures?: string[];
    tables?: string[];
  };

  @ApiPropertyOptional({ example: 'UPDATE plan_de_cuenta SET atributos = 2 WHERE cuenta = \'13050501\';' })
  @IsString()
  @IsOptional()
  solutionScriptSql?: string;

  @ApiPropertyOptional({ example: '1. Backup previo. 2. Ejecutar script en QA. 3. Validar totales.' })
  @IsString()
  @IsOptional()
  implementationSteps?: string;

  @ApiPropertyOptional({ example: 'RESTORE DATABASE SismaContabilidad FROM DISK = \'D:\\Backup.bak\';' })
  @IsString()
  @IsOptional()
  rollbackProcedure?: string;

  @ApiPropertyOptional({ example: 'PRODUCCION' })
  @IsString()
  @IsOptional()
  validationEnvironment?: string;

  @ApiPropertyOptional({ example: 'Diferencia final: $0.00 pesos. Reporte conciliado.' })
  @IsString()
  @IsOptional()
  testResults?: string;
}

export class UpdateCaseClientResponseDto {
  @ApiProperty({ example: 'Se evaluaron las diferencias entre el informe FT003 y el libro anexo.' })
  @IsString()
  @IsNotEmpty()
  issueSummaryClient: string;

  @ApiPropertyOptional({ example: 'Cuentas contables de clientes sin marca en el catálogo.' })
  @IsString()
  @IsOptional()
  causeExplainedClient?: string;

  @ApiProperty({ example: 'Se actualizó la parametrización de cuentas y se recalculó la cartera.' })
  @IsString()
  @IsNotEmpty()
  actionTakenClient: string;

  @ApiPropertyOptional({ example: 'Por favor emitir nuevo extracto y confirmar satisfacción.' })
  @IsString()
  @IsOptional()
  pendingClientActions?: string;

  @ApiPropertyOptional({ example: 'Asignar siempre código de factura en los comprobantes manuales.' })
  @IsString()
  @IsOptional()
  recommendations?: string;

  @ApiPropertyOptional({ example: false, description: 'Si es true, se publica inmediatamente' })
  @IsBoolean()
  @IsOptional()
  publishNow?: boolean;
}

export class AddTimelineCommentDto {
  @ApiProperty({ example: 'Se solicitó backup actualizado al cliente' })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isInternalOnly?: boolean;
}

export class CaseQueryDto {
  @ApiPropertyOptional({ example: '00226' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: CaseStatus })
  @IsEnum(CaseStatus)
  @IsOptional()
  status?: CaseStatus;

  @ApiPropertyOptional({ enum: CasePriority })
  @IsEnum(CasePriority)
  @IsOptional()
  priority?: CasePriority;

  @ApiPropertyOptional({ example: 'uuid-client' })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
