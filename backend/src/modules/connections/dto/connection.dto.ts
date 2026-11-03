import { IsNotEmpty, IsString, IsEnum, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DatabaseEngine, EnvironmentType } from '../../../common/enums';

export class CreateConnectionDto {
  @ApiProperty({ example: 'Servidor Principal Contabilidad (Producción)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: DatabaseEngine, example: DatabaseEngine.MSSQL })
  @IsEnum(DatabaseEngine)
  engine: DatabaseEngine;

  @ApiProperty({ example: '10.120.1.4' })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiPropertyOptional({ example: 1433 })
  @IsInt()
  @IsOptional()
  port?: number;

  @ApiPropertyOptional({ example: 'SISMA' })
  @IsString()
  @IsOptional()
  instanceName?: string;

  @ApiProperty({ example: 'SismaContabilidad' })
  @IsString()
  @IsNotEmpty()
  databaseName: string;

  @ApiProperty({ example: 'sa_lectura' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'SuperPassword123!', description: 'Contraseña a ser cifrada con AES-256' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ enum: EnvironmentType, example: EnvironmentType.PRODUCCION })
  @IsEnum(EnvironmentType)
  @IsOptional()
  environment?: EnvironmentType;

  @ApiPropertyOptional({ example: true, description: 'Modo solo lectura por defecto' })
  @IsBoolean()
  @IsOptional()
  isReadOnly?: boolean;
}

export class UpdateConnectionDto {
  @ApiPropertyOptional({ example: 'Servidor Principal Contabilidad (Producción)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: DatabaseEngine, example: DatabaseEngine.MSSQL })
  @IsEnum(DatabaseEngine)
  @IsOptional()
  engine?: DatabaseEngine;

  @ApiPropertyOptional({ example: '10.120.1.4' })
  @IsString()
  @IsOptional()
  host?: string;

  @ApiPropertyOptional({ example: 1433 })
  @IsInt()
  @IsOptional()
  port?: number;

  @ApiPropertyOptional({ example: 'SISMA' })
  @IsString()
  @IsOptional()
  instanceName?: string;

  @ApiPropertyOptional({ example: 'SismaContabilidad' })
  @IsString()
  @IsOptional()
  databaseName?: string;

  @ApiPropertyOptional({ example: 'sa_lectura' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'SuperPassword123!', description: 'Nueva contraseña opcional para re-cifrar con AES-256' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ enum: EnvironmentType, example: EnvironmentType.PRODUCCION })
  @IsEnum(EnvironmentType)
  @IsOptional()
  environment?: EnvironmentType;

  @ApiPropertyOptional({ example: true, description: 'Modo solo lectura' })
  @IsBoolean()
  @IsOptional()
  isReadOnly?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Estado activo o inactivo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

