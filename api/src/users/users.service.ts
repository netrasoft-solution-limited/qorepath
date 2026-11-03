import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from './user.entity';

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
// Minimum gap between password emails for one account, so the endpoint can't be used to spam an inbox.
const RESET_THROTTLE_MS = 60 * 1000;

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(data: Partial<User>) {
    return this.repo.save(this.repo.create(data));
  }

  async findAll() {
    const users = await this.repo.find({ order: { createdAt: 'DESC' } });
    return users.map(({ password, ...u }) => u);
  }

  async findOne(id: string) {
    const user = await this.repo.findOneBy({ id });
    if (!user) return null;
    const { password, ...u } = user;
    return u;
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  // Only for credential checks — password is excluded from every other query.
  findByEmailWithPassword(email: string) {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  /**
   * Issues a single-use password token valid for `ttlMs` and returns it (only its
   * hash is stored). Returns null if one was issued for this user in the last minute.
   */
  async issueResetToken(userId: string, ttlMs: number): Promise<string | null> {
    const current = await this.repo
      .createQueryBuilder('user')
      .addSelect('user.resetTokenIssuedAt')
      .where('user.id = :userId', { userId })
      .getOne();
    if (current?.resetTokenIssuedAt && Date.now() - +current.resetTokenIssuedAt < RESET_THROTTLE_MS) {
      return null;
    }
    const token = crypto.randomBytes(32).toString('hex');
    await this.repo.update(userId, {
      resetTokenHash: sha256(token),
      resetTokenExpires: new Date(Date.now() + ttlMs),
      resetTokenIssuedAt: new Date(),
    });
    return token;
  }

  /** Sets a new (already hashed) password if the token is valid, then invalidates the token. Returns the user, or null. */
  async consumeResetToken(token: string, passwordHash: string): Promise<User | null> {
    const user = await this.repo
      .createQueryBuilder('user')
      .addSelect('user.resetTokenExpires')
      .where('user.resetTokenHash = :hash', { hash: sha256(token) })
      .getOne();
    if (!user?.resetTokenExpires || user.resetTokenExpires < new Date()) return null;
    await this.repo.update(user.id, {
      password: passwordHash,
      resetTokenHash: null,
      resetTokenExpires: null,
    });
    return user;
  }

  update(id: string, data: Partial<User>) {
    return this.repo.update(id, data);
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}
