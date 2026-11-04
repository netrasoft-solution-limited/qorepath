import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './material.entity';

@Injectable()
export class MaterialsService {
  constructor(@InjectRepository(Material) private repo: Repository<Material>) {}

  create(data: Partial<Material>) {
    return this.repo.save(this.repo.create(data));
  }

  /** Learners read this too, so the uploader is reduced to a display name. */
  async findByProgram(programId: string) {
    const rows = await this.repo.find({
      where: { program: { id: programId } },
      order: { week: 'ASC', createdAt: 'ASC' },
    });
    return rows.map(({ uploadedBy: u, program, ...m }) => ({
      ...m,
      program: program ? { id: program.id, track: program.track } : null,
      uploadedBy: u ? { id: u.id, firstName: u.firstName, lastName: u.lastName } : null,
    }));
  }

  async programIdOf(id: string): Promise<string | undefined> {
    const m = await this.repo.findOneBy({ id });
    if (!m) throw new NotFoundException('Material not found');
    return m.program?.id;
  }

  async remove(id: string) {
    const m = await this.repo.findOneBy({ id });
    if (!m) throw new NotFoundException('Material not found');
    return this.repo.remove(m);
  }
}
