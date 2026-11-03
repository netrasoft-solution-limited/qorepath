import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private service: MaterialsService) {}

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Post()
  create(@Body() body: any, @Request() req: any) {
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
  findByProgram(@Param('programId') programId: string) {
    return this.service.findByProgram(programId);
  }

  @Roles(UserRole.INSTRUCTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
