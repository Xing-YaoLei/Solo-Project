import { User, UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: UserWithoutPassword;
}

export type UserWithoutPassword = Omit<User, 'password'>;

export class JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
