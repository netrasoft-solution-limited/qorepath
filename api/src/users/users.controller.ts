import {
  Controller, Get, Post, Param, Patch, Body, Delete, UseGuards, Request, ForbiddenException,
  BadRequestException, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import type { UploadedFileLike } from '../storage/storage.service';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { User, UserRole } from './user.entity';
import { AccessService } from '../access/access.service';
import { Audit, fullName } from '../audit/audit.decorator';

// Fields a non-admin user is allowed to change on their own profile.
const SELF_EDITABLE = ['firstName', 'lastName', 'phone'];
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
// Fields an admin may change on any (non-super-admin) account.
const ADMIN_EDITABLE = [...SELF_EDITABLE, 'email', 'role', 'permissions', 'isActive'];
// Changes worth a line in the audit log (never passwords or tokens).
const AUDITED_FIELDS = ['email', 'role', 'permissions', 'isActive', 'isSuperAdmin', 'firstName', 'lastName', 'phone'];

const describeUserChange = (before: any, after: any) => {
  const who = `${fullName(after ?? before)} (${(after ?? before)?.email})`;
  if (before?.isActive !== after?.isActive) return `${after?.isActive ? 'Reactivated' : 'Suspended'} ${who}`;
  if (before?.isSuperAdmin !== after?.isSuperAdmin) return `${after?.isSuperAdmin ? 'Made' : 'Removed'} ${who} ${after?.isSuperAdmin ? 'a super admin' : 'as super admin'}`;
  if (before?.role !== after?.role) return `Changed ${who} from ${before?.role} to ${after?.role}`;
  if (JSON.stringify(before?.permissions) !== JSON.stringify(after?.permissions)) return `Changed admin permissions for ${who}`;
  return `Updated account details for ${who}`;
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private access: AccessService,
    private storage: StorageService,
  ) {}

  // Profile photo for whoever is signed in. Photos are stored on Publitio only.
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES } }))
  @Post('me/avatar')
  async uploadAvatar(@UploadedFile() file: UploadedFileLike | undefined, @Request() req: any) {
    if (!file) throw new BadRequestException('Choose a photo to upload');
    if (!PHOTO_TYPES.includes(file.mimetype)) throw new BadRequestException('Upload a JPG, PNG or WebP image');
    const me = (await this.usersService.findOne(req.user.id))!;
    const stored = await this.storage.upload(file, `Profile photo ${me.email}`, 'photo');
    if (!stored) throw new BadRequestException("Photo uploads aren't switched on yet. An admin needs to connect Publitio in Settings → Integrations.");
    await this.usersService.update(me.id, { avatarUrl: stored.url, avatarStorageId: stored.id } as any);
    await this.storage.remove(me.avatarStorageId);
    return this.usersService.findOne(me.id);
  }

  @Delete('me/avatar')
  async removeAvatar(@Request() req: any) {
    const me = (await this.usersService.findOne(req.user.id))!;
    await this.usersService.update(me.id, { avatarUrl: null, avatarStorageId: null } as any);
    await this.storage.remove(me.avatarStorageId);
    return this.usersService.findOne(me.id);
  }

  private async isSuperAdmin(userId: string) {
    return !!(await this.usersService.findOne(userId))?.isSuperAdmin;
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users', 'instructors')
  @Audit({
    action: 'USER_CREATED',
    entity: 'User',
    summary: ({ result }) => `Created ${result?.role} account for ${fullName(result)} (${result?.email})`,
  })
  @Post()
  async create(
    @Body() body: { firstName: string; lastName: string; email: string; password: string; role: string; phone?: string },
    @Request() req: any,
  ) {
    const { firstName, lastName, email, password, role, phone } = body ?? ({} as any);
    // "Teaching Staff" alone may only create instructors and assistants.
    if (
      role !== UserRole.INSTRUCTOR && role !== UserRole.ASSISTANT &&
      !(await this.access.adminHas(req.user.id, 'users'))
    ) {
      throw new ForbiddenException('You can only create instructor and assistant accounts');
    }
    await this.authService.register({ firstName, lastName, email, password, role, phone } as any);
    await this.authService.sendAccountSetup(body.email);
    return this.usersService.findByEmail(body.email);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users', 'instructors', 'certificates', 'cohorts')
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

  @Audit({
    action: 'USER_UPDATED',
    entity: 'User',
    load: User,
    track: AUDITED_FIELDS,
    skipIfUnchanged: true,
    // Staff and learners editing their own name aren't logged.
    when: ({ user }) => user?.role === UserRole.ADMIN,
    actionFor: ({ before, after }) =>
      before?.isActive !== after?.isActive ? (after?.isActive ? 'USER_REACTIVATED' : 'USER_SUSPENDED')
      : before?.isSuperAdmin !== after?.isSuperAdmin ? 'SUPER_ADMIN_CHANGED'
      : before?.role !== after?.role ? 'ROLE_CHANGED'
      : JSON.stringify(before?.permissions) !== JSON.stringify(after?.permissions) ? 'PERMISSIONS_CHANGED'
      : 'USER_UPDATED',
    summary: ({ before, after }) => describeUserChange(before, after),
  })
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
    // Per-admin permissions: "users" = full edit; "instructors" = suspend/reactivate
    // teaching staff only; neither = their own profile fields only.
    let allowed = [...ADMIN_EDITABLE, ...(callerIsSuper ? ['isSuperAdmin'] : [])];
    if (!(await this.access.adminHas(req.user.id, 'users'))) {
      const target = await this.usersService.findOne(id);
      const isStaff = target?.role === UserRole.INSTRUCTOR || target?.role === UserRole.ASSISTANT;
      if (isStaff && (await this.access.adminHas(req.user.id, 'instructors'))) allowed = ['isActive'];
      else if (id === req.user.id) allowed = SELF_EDITABLE;
      else throw new ForbiddenException("Your admin account doesn't have access to this area");
    }
    body = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    if (callerIsSuper && id === req.user.id && body.isSuperAdmin === false) {
      throw new ForbiddenException("You can't remove your own super admin access");
    }
    return this.usersService.update(id, body);
  }

  @Roles(UserRole.ADMIN)
  @RequirePermission('users')
  @Audit({
    action: 'USER_DELETED',
    entity: 'User',
    load: User,
    summary: ({ before, params }) => before ? `Deleted ${before.role} account ${fullName(before)} (${before.email})` : `Deleted user ${params.id}`,
  })
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    if (id === req.user.id) throw new ForbiddenException("You can't delete your own account");
    if ((await this.isSuperAdmin(id)) && !(await this.isSuperAdmin(req.user.id))) {
      throw new ForbiddenException('Only a super admin can delete a super admin account');
    }
    return this.usersService.remove(id);
  }
}
