import { Controller, Get, Post, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';

@Controller('certificates')
export class CertificatesController {
  constructor(private certificatesService: CertificatesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('certificates')
  @Post()
  issue(@Body() body: any) {
    return this.certificatesService.issue(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('certificates', 'reports', 'audit_log')
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
