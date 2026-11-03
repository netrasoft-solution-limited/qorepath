import { Controller, Post, Body, Query, Headers, HttpCode } from '@nestjs/common';
import { SessionsService } from './sessions.service';

// Public (unguarded) endpoint that 8x8 JaaS calls when a recording is ready.
// Authenticated by a shared secret passed as ?token= or x-webhook-secret header.
@Controller('sessions')
export class JaasWebhookController {
  constructor(private sessionsService: SessionsService) {}

  @Post('jaas-webhook')
  @HttpCode(200)
  webhook(
    @Body() body: any,
    @Query('token') token: string,
    @Headers('x-webhook-secret') headerSecret: string,
  ) {
    return this.sessionsService.handleRecordingWebhook(body, token || headerSecret);
  }
}
