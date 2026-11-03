import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { NotificationsService } from './notifications.service';

// Global so any feature service can inject NotificationsService without importing this module.
@Global()
@Module({
  providers: [MailService, NotificationsService],
  exports: [MailService, NotificationsService],
})
export class MailModule {}
