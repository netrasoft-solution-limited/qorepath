import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

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

  update(id: string, data: Partial<User>) {
    return this.repo.update(id, data);
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}
