import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);

export interface CurrentUserType {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
}
