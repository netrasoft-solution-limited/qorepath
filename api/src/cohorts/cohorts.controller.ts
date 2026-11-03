import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CohortsService } from './cohorts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';
import { Audit, fullName, naira } from '../audit/audit.decorator';
import { Cohort } from './cohort.entity';

@Controller('cohorts')
export class CohortsController {
  constructor(private cohortsService: CohortsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('cohorts')
  @Audit({ action: 'COHORT_CREATED', entity: 'Cohort', summary: ({ result }) => `Created cohort ${result?.name}` })
  @Post()
  create(@Body() body: any) {
    return this.cohortsService.create(body);
  }

  @Get()
  findAll() {
    return this.cohortsService.findAll();
  }

  // Full record (staff contact details included) — admin only; the public listing is GET /cohorts.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('cohorts')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cohortsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('cohorts')
  @Audit({
    action: 'COHORT_UPDATED', entity: 'Cohort', load: Cohort, track: ['name', 'status', 'startDate', 'endDate', 'description'], skipIfUnchanged: true,
    summary: ({ before, after }) =>
      before?.status !== after?.status ? `Changed cohort ${after?.name} from ${before?.status} to ${after?.status}` : `Edited cohort ${after?.name}`,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.cohortsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('cohorts')
  @Audit({ action: 'COHORT_DELETED', entity: 'Cohort', load: Cohort, summary: ({ before, params }) => `Deleted cohort ${before?.name ?? params.id}` })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cohortsService.remove(id);
  }
}
