import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from '../settings/setting.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';

// Global so PaystackService and MailService can read current credentials anywhere.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  providers: [IntegrationsService],
  controllers: [IntegrationsController],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
