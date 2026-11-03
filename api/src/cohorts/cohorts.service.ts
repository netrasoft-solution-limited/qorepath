import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohort } from './cohort.entity';

@Injectable()
export class CohortsService {
  constructor(@InjectRepository(Cohort) private repo: Repository<Cohort>) {}

  create(data: Partial<Cohort>) {
    return this.repo.save(this.repo.create(data));
  }

  findAll() {
    return this.repo.find({ relations: ['programs', 'programs.instructor', 'programs.assistants'] });
  }

  async findOne(id: string) {
    const cohort = await this.repo.findOne({
      where: { id },
      relations: ['programs', 'programs.instructor', 'programs.assistants'],
    });
    if (!cohort) throw new NotFoundException('Cohort not found');
    return cohort;
  }

  async update(id: string, data: any) {
    const cohort = await this.findOne(id);
    Object.assign(cohort, data);
    return this.repo.save(cohort);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
