import {
  Controller, Get, Post, Param, Patch, Body, Delete, UseGuards, Request, ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user.entity';

// Fields a non-admin user is allowed to change on their own profile.
const SELF_EDITABLE = ['firstName', 'lastName', 'phone', 'avatarUrl'];
// Fields an admin may change on any (non-super-admin) account.
const ADMIN_EDITABLE = [...SELF_EDITABLE, 'email', 'role', 'permissions', 'isActive'];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  private async isSuperAdmin(userId: string) {
    return !!(await this.usersService.findOne(userId))?.isSuperAdmin;
  }

  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() body: { firstName: string; lastName: string; email: string; password: string; role: string; phone?: string }) {
    const { firstName, lastName, email, password, role, phone } = body ?? ({} as any);
    await this.authService.register({ firstName, lastName, email, password, role, phone } as any);
    await this.authService.sendAccountSetup(body.email);
    return this.usersService.findByEmail(body.email);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Partial<any>, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    body = body ?? {};

    // Non-admins may only edit their own profile, and only safe fields —
    // never role, permissions, isActive, email, or password.
    if (!isAdmin) {
      if (req.user.id !== id) {
        throw new ForbiddenException('You can only edit your own profile');
      }
      body = Object.fromEntries(
        Object.entries(body).filter(([k]) => SELF_EDITABLE.includes(k)),
      );
      return this.usersService.update(id, body);
    }

    // Admins: an allow-list (never password hashes or reset tokens). Super-admin
    // accounts and the super-admin flag can only be changed by a super admin.
    const callerIsSuper = await this.isSuperAdmin(req.user.id);
    if (!callerIsSuper && (await this.isSuperAdmin(id))) {
      throw new ForbiddenException('Only a super admin can change a super admin account');
    }
    const allowed = [...ADMIN_EDITABLE, ...(callerIsSuper ? ['isSuperAdmin'] : [])];
    body = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    if (callerIsSuper && id === req.user.id && body.isSuperAdmin === false) {
      throw new ForbiddenException("You can't remove your own super admin access");
    }
    return this.usersService.update(id, body);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    if (id === req.user.id) throw new ForbiddenException("You can't delete your own account");
    if ((await this.isSuperAdmin(id)) && !(await this.isSuperAdmin(req.user.id))) {
      throw new ForbiddenException('Only a super admin can delete a super admin account');
    }
    return this.usersService.remove(id);
  }
}
