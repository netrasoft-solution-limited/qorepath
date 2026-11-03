import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './certificate.entity';

@Injectable()
export class CertificatesService {
  constructor(@InjectRepository(Certificate) private repo: Repository<Certificate>) {}

  issue(data: Partial<Certificate>) {
    const certificateNumber = `QP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    return this.repo.save(this.repo.create({ ...data, certificateNumber, issuedDate: new Date() }));
  }

  findAll() {
    return this.repo.find();
  }

  findByUser(userId: string) {
    return this.repo.find({ where: { user: { id: userId } } });
  }

  async findOne(id: string) {
    const cert = await this.repo.findOneBy({ id });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async verify(certificateNumber: string) {
    const cert = await this.repo.findOneBy({ certificateNumber });
    if (!cert) throw new NotFoundException('Certificate not found or invalid');
    return cert;
  }
}
