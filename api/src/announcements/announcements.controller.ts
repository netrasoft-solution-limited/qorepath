import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.announcementsService.create({ ...body, author: { id: req.user.id } });
  }

  @Get()
  findAll() {
    return this.announcementsService.findAll();
  }

  @Get('cohort/:cohortId')
  findByCohort(@Param('cohortId') cohortId: string) {
    return this.announcementsService.findByCohort(cohortId);
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.announcementsService.update(id, body);
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
