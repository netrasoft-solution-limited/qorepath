import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Program } from '../programs/program.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaystackService } from './paystack.service';
import { InstalmentRemindersService } from './instalment-reminders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Enrollment, Program])],
  providers: [PaymentsService, PaystackService, InstalmentRemindersService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
