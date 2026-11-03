import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from './cohort.entity';
import { CohortsService } from './cohorts.service';
import { CohortsController } from './cohorts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cohort])],
  providers: [CohortsService],
  controllers: [CohortsController],
  exports: [CohortsService],
})
export class CohortsModule {}
