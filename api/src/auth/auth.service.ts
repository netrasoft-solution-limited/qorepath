import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../mail/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ROLE_DEFAULT_PERMISSIONS } from './permissions';

const HOUR = 60 * 60 * 1000;
const RESET_TOKEN_TTL = 1 * HOUR;
// Staff accounts created by an admin get longer to set their first password.
const SETUP_TOKEN_TTL = 72 * HOUR;


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private notifications: NotificationsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const permissions = ROLE_DEFAULT_PERMISSIONS[(dto as any).role ?? 'learner'] ?? ROLE_DEFAULT_PERMISSIONS['learner'];
    const user = await this.usersService.create({ ...dto, password: hashed, permissions });
    return this.signToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Your account has been suspended. Contact an administrator.');

    return this.signToken(user.id, user.email, user.role);
  }

  /** Always returns the same response, so it can't be used to discover which emails have accounts. */
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user?.isActive) {
      const token = await this.usersService.issueResetToken(user.id, RESET_TOKEN_TTL);
      if (token) this.notifications.passwordReset(user, token);
    }
    return { ok: true };
  }

  async resetPassword(token: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const ok = await this.usersService.consumeResetToken(token, hashed);
    if (!ok) throw new BadRequestException('This reset link is invalid or has expired. Please request a new one.');
    return { ok: true };
  }

  /** Emails a newly admin-created account a link to set their own password. */
  async sendAccountSetup(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;
    const token = await this.usersService.issueResetToken(user.id, SETUP_TOKEN_TTL);
    if (token) this.notifications.staffAccountCreated(user, token);
  }

  private signToken(sub: string, email: string, role: string) {
    const token = this.jwtService.sign({ sub, email, role });
    return { accessToken: token, role };
  }
}
