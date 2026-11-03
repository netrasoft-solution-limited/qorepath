import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CohortsService } from './cohorts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermission } from '../auth/permissions';
import { UserRole } from '../users/user.entity';

@Controller('cohorts')
export class CohortsController {
  constructor(private cohortsService: CohortsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('cohorts')
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
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.cohortsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission('cohorts')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cohortsService.remove(id);
  }
}
