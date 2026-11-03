import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraduationRecord } from './graduation.entity';
import { GraduationService } from './graduation.service';
import { GraduationController } from './graduation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GraduationRecord])],
  providers: [GraduationService],
  controllers: [GraduationController],
})
export class GraduationModule {}
