import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  authorizedClients?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'casedesk-secret-key-super-secure-2026-development-token',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token inválido');
    }
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      authorizedClients: payload.authorizedClients || [],
    };
  }
}
