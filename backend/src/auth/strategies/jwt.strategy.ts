import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: {
        id: user.role.id,
        name: user.role.name,
        code: user.role.code,
      },
      permissions: user.role.permissions.map((p) => p.code),
    };
  }
}
