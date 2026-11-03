import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { NotificationsService } from '../mail/notifications.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';
import { clientIp } from '../audit/audit.interceptor';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private notifications: NotificationsService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // Public sign-up is always a learner; staff accounts are created by admins via POST /users.
    const result = await this.authService.register({ ...dto, role: UserRole.LEARNER });
    this.notifications.welcome({ email: dto.email, firstName: dto.firstName });
    return result;
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto, @Request() req: any) {
    return this.authService.resetPassword(dto.token, dto.password, clientIp(req));
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Request() req: any) {
    return this.authService.login(dto, clientIp(req));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }
}
