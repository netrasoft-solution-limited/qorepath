import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';
import { NotificationsService } from '../mail/notifications.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement) private repo: Repository<Announcement>,
    private notifications: NotificationsService,
  ) {}

  async create(data: Partial<Announcement>) {
    const saved = await this.repo.save(this.repo.create(data));
    this.notifications.announcementPosted(saved.id);
    return saved;
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
