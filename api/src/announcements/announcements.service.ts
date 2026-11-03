import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';

@Injectable()
export class AnnouncementsService {
  constructor(@InjectRepository(Announcement) private repo: Repository<Announcement>) {}

  create(data: Partial<Announcement>) {
    return this.repo.save(this.repo.create(data));
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByCohort(cohortId: string) {
    return this.repo.find({ where: { cohort: { id: cohortId } }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const a = await this.repo.findOneBy({ id });
    if (!a) throw new NotFoundException('Announcement not found');
    return a;
  }

  async update(id: string, data: Partial<Announcement>) {
    await this.findOne(id);
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
