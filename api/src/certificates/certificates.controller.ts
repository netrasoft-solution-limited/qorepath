import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, Request, Res,
  ForbiddenException, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CertificatesService, MAX_FILE_BYTES } from './certificates.service';
import type { UploadedCertificateFile } from './certificates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';
import { Audit, fullName } from '../audit/audit.decorator';
import { Certificate } from './certificate.entity';

const upload = FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } });
const describe = (c?: Certificate | null) =>
  `${c?.certificateNumber} for ${fullName(c?.user)} (${c?.enrollment?.program?.track ?? c?.cohort?.name ?? 'cohort'})`;

function sendFile(res: Response, cert: Certificate) {
  res.set({
    'Content-Type': cert.fileType ?? 'application/octet-stream',
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(cert.fileName ?? 'certificate')}`,
    'Cache-Control': 'private, no-store',
  });
  res.send(cert.fileData);
}

@Controller('certificates')
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  // multipart/form-data: graduationId, plus an optional `file`
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('certificates')
  @UseInterceptors(upload)
  @Audit({
    action: 'CERTIFICATE_ISSUED', entity: 'Certificate', load: Certificate,
    summary: ({ after }) => `Issued certificate ${describe(after)}${after?.fileName ? ` with file "${after.fileName}"` : ''}`,
  })
  @Post()
  issue(@Body('graduationId') graduationId: string, @UploadedFile() file?: UploadedCertificateFile) {
    return this.certificatesService.issue(graduationId, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('certificates')
  @UseInterceptors(upload)
  @Audit({
    action: 'CERTIFICATE_FILE_UPLOADED', entity: 'Certificate', load: Certificate, track: ['fileName'],
    summary: ({ after }) => `Uploaded "${after?.fileName}" to certificate ${describe(after)}`,
  })
  @Post(':id/file')
  attachFile(@Param('id') id: string, @UploadedFile() file?: UploadedCertificateFile) {
    return this.certificatesService.attachFile(id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('certificates')
  @Audit({
    action: 'CERTIFICATE_FILE_REMOVED', entity: 'Certificate', load: Certificate, track: ['fileName'],
    summary: ({ before }) => `Removed "${before?.fileName}" from certificate ${describe(before)}`,
  })
  @Delete(':id/file')
  removeFile(@Param('id') id: string) {
    return this.certificatesService.removeFile(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('certificates')
  @Audit({
    action: 'CERTIFICATE_REVOKED', entity: 'Certificate', load: Certificate,
    summary: ({ before }) => `Revoked certificate ${describe(before)}`,
  })
  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.certificatesService.revoke(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('certificates', 'graduation', 'reports', 'audit_log')
  @Get()
  findAll() {
    return this.certificatesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMine(@Request() req: any) {
    return this.certificatesService.findByUser(req.user.id);
  }

  // Public — no auth required for certificate verification
  @Get('verify/:certificateNumber')
  verify(@Param('certificateNumber') certNumber: string) {
    return this.certificatesService.verify(certNumber);
  }

  // Public, like verification: anyone holding the number can view the certificate itself.
  @Get('verify/:certificateNumber/file')
  async verifyFile(@Param('certificateNumber') certificateNumber: string, @Res() res: Response) {
    sendFile(res, await this.certificatesService.file({ certificateNumber }));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/file')
  async file(@Param('id') id: string, @Request() req: any, @Res() res: Response) {
    const cert = await this.certificatesService.file({ id });
    if (req.user.role !== UserRole.ADMIN && cert.user?.id !== req.user.id) {
      throw new ForbiddenException('You can only view your own certificates');
    }
    sendFile(res, cert);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const cert = await this.certificatesService.findOne(id);
    if (req.user.role !== UserRole.ADMIN && cert.user?.id !== req.user.id) {
      throw new ForbiddenException('You can only view your own certificates');
    }
    return cert;
  }
}
