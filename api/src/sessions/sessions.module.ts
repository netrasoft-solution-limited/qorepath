import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { Attendance } from './attendance.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { User } from '../users/user.entity';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { JaasWebhookController } from './jaas-webhook.controller';
import { JaasService } from './jaas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Attendance, Enrollment, User])],
  providers: [SessionsService, JaasService],
  controllers: [SessionsController, JaasWebhookController],
  exports: [SessionsService],
})
export class SessionsModule {}
