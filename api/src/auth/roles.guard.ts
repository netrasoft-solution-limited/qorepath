import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ROLES_KEY } from './roles.decorator';
import { PERMISSIONS_KEY, effectivePermissions } from './permissions';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, targets);
    const { user } = context.switchToHttp().getRequest();
    if (required && !required.includes(user?.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Per-admin permissions (set on the Users screen) — read fresh from the DB so
    // changes apply immediately. Super admins bypass.
    const anyOf = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, targets);
    if (anyOf?.length && user?.role === UserRole.ADMIN) {
      const u = await this.dataSource.getRepository(User).findOneBy({ id: user.id });
      if (!u || !u.isActive) throw new ForbiddenException('Insufficient permissions');
      if (!u.isSuperAdmin) {
        const mine = effectivePermissions(u);
        if (!anyOf.some((p) => mine.includes(p))) {
          throw new ForbiddenException("Your admin account doesn't have access to this area");
        }
      }
    }
    return true;
  }
}
