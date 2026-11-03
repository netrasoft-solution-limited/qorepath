import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private service: ProgramsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get('cohort/:cohortId')
  findByCohort(@Param('cohortId') cohortId: string) {
    return this.service.findByCohort(cohortId);
  }

  @Get('mine')
  getMine(@Request() req: any) {
    return this.service.findMine(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
