import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Decorator khai báo các role được phép truy cập endpoint. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
