import { IsNotEmpty, IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ example: 'CLI-001', description: 'Código único de cliente' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'SOMEDYT S.A.S.', description: 'Razón social o nombre del cliente' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiPropertyOptional({ example: '806016797-1' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ example: 'Carlos Martínez' })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({ example: 'cmartinez@somedyt.com' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Cliente corporativo sector salud IPS' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'SOMEDYT S.A.S.' })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({ example: '806016797-1' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ example: 'Carlos Martínez' })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({ example: 'cmartinez@somedyt.com' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Cliente corporativo' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
