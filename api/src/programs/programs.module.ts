import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Program } from './program.entity';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Program])],
  providers: [ProgramsService],
  controllers: [ProgramsController],
  exports: [ProgramsService],
})
export class ProgramsModule {}
