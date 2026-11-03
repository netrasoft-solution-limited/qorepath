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

  findByProgram(programId: string) {
    return this.repo.find({
      where: { program: { id: programId } },
      order: { week: 'ASC', createdAt: 'ASC' },
    });
  }

  async remove(id: string) {
    const m = await this.repo.findOneBy({ id });
    if (!m) throw new NotFoundException('Material not found');
    return this.repo.remove(m);
  }
}
