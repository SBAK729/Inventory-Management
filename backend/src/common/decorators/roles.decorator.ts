import { SetMetadata } from '@nestjs/common';
import { Role } from '../../prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts an endpoint to one or more roles, e.g. @Roles(Role.ADMIN, Role.MANAGER)
 * Must be used together with RolesGuard.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
