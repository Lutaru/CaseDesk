import { IsNotEmpty, IsString, IsEmail, MinLength, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'juandev', description: 'Nombre de usuario único' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'juan.dev@empresa.com', description: 'Correo electrónico' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ContraseñaSegura123!', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: [2], description: 'IDs de roles asignados' })
  @IsArray()
  @IsOptional()
  roleIds?: number[];

  @ApiPropertyOptional({ example: ['client-uuid'], description: 'IDs de clientes autorizados' })
  @IsArray()
  @IsOptional()
  authorizedClientIds?: string[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan Carlos' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez Gómez' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'juan.perez@empresa.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'NuevaClave123!' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: [2] })
  @IsArray()
  @IsOptional()
  roleIds?: number[];

  @ApiPropertyOptional({ example: ['client-uuid'] })
  @IsArray()
  @IsOptional()
  authorizedClientIds?: string[];
}
