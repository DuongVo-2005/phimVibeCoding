import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtConfig } from '../../config/configuration';
import { AuthenticatedUser, JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    const jwtConfig = configService.get<JwtConfig>('jwt')!;
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.refreshSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): AuthenticatedUser & { refreshToken: string } {
    const refreshToken = req.body?.refreshToken;
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      refreshToken,
    };
  }
}
