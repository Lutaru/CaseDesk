import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Nombre de usuario' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  username: string;

  @ApiProperty({ example: 'admin123', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
  password: string;
}
