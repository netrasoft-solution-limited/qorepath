import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './certificate.entity';
import { GraduationRecord, GraduationStatus } from '../graduation/graduation.entity';
import { NotificationsService } from '../mail/notifications.service';
import { StorageService } from '../storage/storage.service';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

const NO_FILE = { fileName: null, fileType: null, fileSize: null, fileUrl: null, fileStorageId: null, fileData: null };

export type UploadedCertificateFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate) private repo: Repository<Certificate>,
    private notifications: NotificationsService,
    private storage: StorageService,
  ) {}

  // A certificate can only be issued for an approved graduation, once per enrollment.
  async issue(graduationId: string | undefined, file?: UploadedCertificateFile) {
    if (!graduationId) throw new BadRequestException('Choose an approved graduation to issue a certificate for');
    const g = await this.repo.manager.findOne(GraduationRecord, {
      where: { id: graduationId },
      relations: { enrollment: { learner: true, program: { cohort: true } } },
    });
    if (!g?.enrollment) throw new NotFoundException('Graduation record not found');
    if (g.status !== GraduationStatus.APPROVED) {
      throw new BadRequestException(`This graduation is "${g.status}". Approve it in the Graduation queue first.`);
    }
    if (await this.repo.exists({ where: { enrollment: { id: g.enrollment.id } } })) {
      throw new BadRequestException('A certificate has already been issued for this learner and track');
    }
    const certificateNumber = `NN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const fileCols = file ? await this.fileColumns(file, certificateNumber) : {};
    const saved = await this.repo.save(this.repo.create({
      user: g.enrollment.learner,
      cohort: g.enrollment.program?.cohort,
      enrollment: { id: g.enrollment.id } as any,
      certificateNumber,
      issuedDate: new Date(),
      ...fileCols,
    }));
    this.notifications.certificateIssued(saved.id);
    return this.findOne(saved.id);
  }

  async attachFile(id: string, file?: UploadedCertificateFile) {
    if (!file) throw new BadRequestException('Choose a file to upload');
    const cert = await this.findOne(id);
    await this.repo.update(id, await this.fileColumns(file, cert.certificateNumber));
    await this.storage.remove(cert.fileStorageId);
    return this.findOne(id);
  }

  async removeFile(id: string) {
    const cert = await this.findOne(id);
    await this.repo.update(id, NO_FILE);
    await this.storage.remove(cert.fileStorageId);
    return this.findOne(id);
  }

  async revoke(id: string) {
    const cert = await this.findOne(id);
    await this.repo.delete(id);
    await this.storage.remove(cert.fileStorageId);
    return cert;
  }

  // Publitio when it's set up, otherwise the database.
  private async fileColumns(file: UploadedCertificateFile, certificateNumber: string) {
    if (!FILE_TYPES.includes(file.mimetype)) throw new BadRequestException('Upload a PDF, PNG or JPG file');
    if (file.size > MAX_FILE_BYTES) throw new BadRequestException('The file must be 5 MB or smaller');
    const meta = { fileName: file.originalname, fileType: file.mimetype, fileSize: file.size };
    const stored = await this.storage.upload(file, `Certificate ${certificateNumber}`, 'certificate');
    return stored
      ? { ...meta, fileUrl: stored.url, fileStorageId: stored.id, fileData: null }
      : { ...meta, fileUrl: null, fileStorageId: null, fileData: file.buffer };
  }

  async file(where: { id: string } | { certificateNumber: string }) {
    const cert = await this.repo.findOne({
      where,
      select: { id: true, fileName: true, fileType: true, fileUrl: true, fileData: true, user: { id: true } },
      relations: { user: true },
    });
    if (!cert?.fileUrl && !cert?.fileData) throw new NotFoundException('No certificate file has been uploaded');
    return cert;
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByUser(userId: string) {
    return this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const cert = await this.repo.findOneBy({ id });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async hasCertificate(enrollmentId: string) {
    return this.repo.exists({ where: { enrollment: { id: enrollmentId } } });
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
      track: cert.enrollment?.program?.track ?? null,
      hasFile: !!cert.fileName,
    };
  }
}
