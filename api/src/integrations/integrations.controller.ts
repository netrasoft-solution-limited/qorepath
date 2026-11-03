import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { IntegrationsService } from './integrations.service';
import { MailService } from '../mail/mail.service';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private integrations: IntegrationsService, private mail: MailService) {}

  @Get()
  status() {
    return this.integrations.status();
  }

  @Put('paystack')
  savePaystack(@Body() body: { secretKey?: string; publicKey?: string }, @Request() req: any) {
    return this.integrations.savePaystack(body ?? {}, req.user.email);
  }

  @Put('resend')
  saveResend(@Body() body: { apiKey?: string; mailFrom?: string }, @Request() req: any) {
    return this.integrations.saveResend(body ?? {}, req.user.email);
  }

  /** Revert to the server's environment values. */
  @Delete(':provider')
  async clear(@Param('provider') provider: string) {
    if (provider !== 'paystack' && provider !== 'resend') throw new BadRequestException('Unknown provider');
    await this.integrations.clear(provider);
    return this.integrations.status();
  }

  @Post('resend/test')
  @HttpCode(200)
  async testEmail(@Body('to') to: string, @Request() req: any) {
    const recipient = (to || req.user.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new BadRequestException('Enter a valid email address');
    const result = await this.mail.sendOne({
      to: recipient,
      subject: 'NetraNova test email',
      html: '<p>This is a test email from your NetraNova settings. If you can read this, email sending works.</p>',
    });
    if (!result.ok) throw new BadRequestException(result.error ?? 'Email could not be sent');
    return { sent: true, to: recipient };
  }
}
