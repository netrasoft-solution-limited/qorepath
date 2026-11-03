import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin:      ['cohorts','enrollments','payments','at_risk','instructors','graduation','certificates','revenue','reports','settings','users','audit_log'],
  instructor: ['sessions','calendar','attendance','assignments','roster','announcements','materials','graduation'],
  assistant:  ['sessions','calendar','attendance','assignments','roster','announcements','materials','graduation'],
  learner:    ['sessions','calendar','assignments','capstone','progress','payments','certificate','profile'],
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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

  private signToken(sub: string, email: string, role: string) {
    const token = this.jwtService.sign({ sub, email, role });
    return { accessToken: token, role };
  }
}
