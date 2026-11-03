import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../mail/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ROLE_DEFAULT_PERMISSIONS } from './permissions';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '../users/user.entity';

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
    private audit: AuditService,
  ) {}

  // Sign-ins and password changes are logged for staff and admins (learners would drown out the log).
  private auditStaff(user: { id: string; email: string; role: string }, action: string, summary: string, ip?: string | null) {
    if (user.role === UserRole.LEARNER) return;
    void this.audit.record({ actor: user, action, entity: 'User', entityId: user.id, summary, ip });
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const permissions = ROLE_DEFAULT_PERMISSIONS[(dto as any).role ?? 'learner'] ?? ROLE_DEFAULT_PERMISSIONS['learner'];
    const user = await this.usersService.create({ ...dto, password: hashed, permissions });
    return this.signToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto, ip?: string | null) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      this.auditStaff(user, 'LOGIN_FAILED', `Failed sign-in (wrong password) for ${user.email}`, ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.auditStaff(user, 'LOGIN_FAILED', `Sign-in refused for suspended account ${user.email}`, ip);
      throw new UnauthorizedException('Your account has been suspended. Contact an administrator.');
    }

    this.auditStaff(user, 'LOGIN', `Signed in`, ip);
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

  async resetPassword(token: string, password: string, ip?: string | null) {
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.usersService.consumeResetToken(token, hashed);
    if (user) this.auditStaff(user, 'PASSWORD_CHANGED', `Set a new password using an emailed link`, ip);
    if (!user) throw new BadRequestException('This reset link is invalid or has expired. Please request a new one.');
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
