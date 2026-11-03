import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithdrawalRequest } from './withdrawal-request.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Payment } from '../payments/payment.entity';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalsController } from './withdrawals.controller';
import { SettingsModule } from '../settings/settings.module';
import { PaystackService } from '../payments/paystack.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WithdrawalRequest, Enrollment, Payment]),
    SettingsModule,
  ],
  providers: [WithdrawalsService, PaystackService],
  controllers: [WithdrawalsController],
})
export class WithdrawalsModule {}
