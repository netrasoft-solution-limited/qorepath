import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './certificate.entity';
import { NotificationsService } from '../mail/notifications.service';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate) private repo: Repository<Certificate>,
    private notifications: NotificationsService,
  ) {}

  async issue(data: Partial<Certificate>) {
    const certificateNumber = `NN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const saved = await this.repo.save(this.repo.create({ ...data, certificateNumber, issuedDate: new Date() }));
    this.notifications.certificateIssued(saved.id);
    return saved;
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
    // Public endpoint: confirm who/what/when only — never the holder's contact details.
    return {
      certificateNumber: cert.certificateNumber,
      issuedDate: cert.issuedDate,
      user: { firstName: cert.user?.firstName, lastName: cert.user?.lastName },
      cohort: cert.cohort ? { name: cert.cohort.name, startDate: cert.cohort.startDate, endDate: cert.cohort.endDate } : null,
    };
  }
}
