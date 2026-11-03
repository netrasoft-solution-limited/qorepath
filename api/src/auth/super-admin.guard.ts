import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/user.entity';

/**
 * Allows only active super admins. Re-reads the flag from the database on every
 * request (it is not in the JWT), so revoking it takes effect immediately.
 * Use after JwtAuthGuard.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (!user?.id) throw new ForbiddenException('Super admin access required');
    const u = await this.dataSource.getRepository(User).findOneBy({ id: user.id });
    if (!u || !u.isActive || u.role !== UserRole.ADMIN || !u.isSuperAdmin) {
      throw new ForbiddenException('Super admin access required');
    }
    return true;
  }
}
