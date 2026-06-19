import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export interface CurrentUserType {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: {
    id: string;
    name: string;
    code: string;
  };
  permissions: string[];
}
