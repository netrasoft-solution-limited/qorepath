import { Controller, Get, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InboxService } from './inbox.service';

// Portal bell: GET the caller's feed; POST /seen when they open it.
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class InboxController {
  constructor(private inbox: InboxService) {}

  @Get()
  feed(@Request() req: any) {
    return this.inbox.feed(req.user);
  }

  @Post('seen')
  @HttpCode(200)
  seen(@Request() req: any) {
    return this.inbox.markSeen(req.user.id);
  }
}
