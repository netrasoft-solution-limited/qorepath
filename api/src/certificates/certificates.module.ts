import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './certificate.entity';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate])],
  providers: [CertificatesService],
  controllers: [CertificatesController],
  exports: [CertificatesService],
})
export class CertificatesModule {}
