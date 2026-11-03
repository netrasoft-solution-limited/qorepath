import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AccessService } from '../access/access.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private service: MaterialsService, private access: AccessService) {}

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    await this.access.assert(this.access.canStaffProgram(req.user, body.programId), 'You can only add materials to programs you teach');
    return this.service.create({
      title: body.title,
      url: body.url,
      type: body.type ?? 'link',
      week: body.week ?? 1,
      program: { id: body.programId } as any,
      uploadedBy: { id: req.user.id } as any,
    });
  }

  @Get('program/:programId')
  async findByProgram(@Param('programId') programId: string, @Request() req: any) {
    await this.access.assert(this.access.canViewProgram(req.user, programId));
    return this.service.findByProgram(programId);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.access.assert(this.access.canStaffProgram(req.user, await this.service.programIdOf(id)), 'You can only remove materials from programs you teach');
    return this.service.remove(id);
  }
}
