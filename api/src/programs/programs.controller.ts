import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AccessService } from '../access/access.service';

// Course-content fields teaching staff may edit; price, capacity, cohort and staffing are admin-only.
const STAFF_EDITABLE = ['description', 'duration', 'format', 'schedule', 'outcomes', 'curriculum'];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private service: ProgramsService, private access: AccessService) {}

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

  // Admins can change anything; a program's own instructor/assistant may only edit its course content.
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSISTANT)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    if (req.user.role === UserRole.ADMIN) return this.service.update(id, body);
    await this.access.assert(this.access.canStaffProgram(req.user, id), 'You can only edit programs you teach');
    const content = Object.fromEntries(
      Object.entries(body ?? {}).filter(([k]) => STAFF_EDITABLE.includes(k)),
    );
    return this.service.update(id, content);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
