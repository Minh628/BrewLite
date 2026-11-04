import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard kiểm tra role người dùng từ JWT payload (Sub-task 10.1c).
 * Phải đặt sau JwtAuthGuard để req.user đã được gán.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const user = request.user;

    if (!user?.role || !requiredRoles.includes(user.role as Role)) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Bạn không có quyền thực hiện thao tác này',
        code: 'FORBIDDEN_ROLE',
      });
    }

    return true;
  }
}
