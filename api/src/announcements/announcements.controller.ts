import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AccessService } from '../access/access.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService, private access: AccessService) {}

  private async assertAuthorOrAdmin(id: string, user: any) {
    if (user.role === UserRole.ADMIN) return;
    const a = await this.announcementsService.findOne(id);
    if (a.author?.id !== user.id) throw new ForbiddenException('You can only change your own announcements');
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    const cohortId = body?.cohort?.id;
    // Platform-wide (no cohort) announcements are admin-only.
    if (!cohortId && req.user.role !== UserRole.ADMIN) throw new ForbiddenException('Choose a cohort for this announcement');
    if (cohortId) await this.access.assert(this.access.canStaffCohort(req.user, cohortId), 'You can only announce to cohorts you teach');
    return this.announcementsService.create({ ...body, author: { id: req.user.id } });
  }

  /** Platform-wide announcements plus those for the caller's own cohorts (admins see all). */
  @Get()
  async findAll(@Request() req: any) {
    if (req.user.role === UserRole.ADMIN) return this.announcementsService.findAll();
    return this.announcementsService.findVisible(await this.access.cohortIdsFor(req.user));
  }

  @Get('cohort/:cohortId')
  async findByCohort(@Param('cohortId') cohortId: string, @Request() req: any) {
    await this.access.assert(this.access.canViewCohort(req.user, cohortId));
    return this.announcementsService.findByCohort(cohortId);
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    await this.assertAuthorOrAdmin(id, req.user);
    const { title, body: text, isPinned } = body ?? {};
    return this.announcementsService.update(id, { title, body: text, isPinned });
  }

  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.assertAuthorOrAdmin(id, req.user);
    return this.announcementsService.remove(id);
  }
}
