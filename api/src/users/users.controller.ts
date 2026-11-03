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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() body: { firstName: string; lastName: string; email: string; password: string; role: string; phone?: string }) {
    await this.authService.register(body as any);
    await this.authService.sendAccountSetup(body.email);
    return this.usersService.findByEmail(body.email);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<any>, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;

    // Non-admins may only edit their own profile, and only safe fields —
    // never role, permissions, isActive, email, or password.
    if (!isAdmin) {
      if (req.user.id !== id) {
        throw new ForbiddenException('You can only edit your own profile');
      }
      body = Object.fromEntries(
        Object.entries(body).filter(([k]) => SELF_EDITABLE.includes(k)),
      );
    }

    return this.usersService.update(id, body);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
