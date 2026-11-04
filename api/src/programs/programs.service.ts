import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './program.entity';
import { NotificationsService } from '../mail/notifications.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program) private repo: Repository<Program>,
    private notifications: NotificationsService,
    private settings: SettingsService,
  ) {}

  async create(data: any) {
    const program = this.repo.create({
      track: data.track,
      description: data.description,
      price: data.price ?? 0,
      maxLearners: data.maxLearners || (await this.settings.getCohortRules()).defaultMaxLearners,
      cohort: { id: data.cohortId } as any,
      instructor: data.instructorId ? ({ id: data.instructorId } as any) : null,
      assistants: [],
    });
    const saved = await this.repo.save(program);
    // New track = new seats open for enrollment → alert learners.
    this.notifications.programOpened(saved.id);
    return saved;
  }

  findByCohort(cohortId: string) {
    return this.repo.find({
      where: { cohort: { id: cohortId } },
      relations: ['cohort'],
      order: { createdAt: 'ASC' },
    });
  }

  findByInstructor(instructorId: string) {
    return this.repo.find({
      where: { instructor: { id: instructorId } },
      relations: ['cohort'],
    });
  }

  // Programs a user teaches OR assists on (the instructor portal serves both roles).
  findMine(userId: string) {
    return this.repo
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .leftJoinAndSelect('program.instructor', 'instructor')
      .leftJoinAndSelect('program.assistants', 'assistant')
      .where('instructor.id = :userId', { userId })
      .orWhere('assistant.id = :userId', { userId })
      .orderBy('cohort.startDate', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id }, relations: ['cohort'] });
    if (!p) throw new NotFoundException('Program not found');
    return p;
  }

  async update(id: string, data: any) {
    const program = await this.findOne(id);
    const { instructorId, addAssistantId, removeAssistantId, ...rest } = data;

    if (instructorId !== undefined) {
      program.instructor = instructorId ? ({ id: instructorId } as any) : null;
    }
    if (addAssistantId) {
      if (!program.assistants) program.assistants = [];
      if (!program.assistants.find((a) => a.id === addAssistantId)) {
        program.assistants.push({ id: addAssistantId } as any);
      }
    }
    if (removeAssistantId) {
      program.assistants = (program.assistants ?? []).filter((a) => a.id !== removeAssistantId);
    }
    Object.assign(program, rest);
    return this.repo.save(program);
  }

  async remove(id: string) {
    const p = await this.findOne(id);
    return this.repo.remove(p);
  }
}
