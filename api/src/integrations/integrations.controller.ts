import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { IntegrationsService } from './integrations.service';
import { MailService } from '../mail/mail.service';
import { Audit } from '../audit/audit.decorator';

// Summaries describe what changed, never the key values themselves.
const mode = (k?: string) => (k?.includes('_live_') ? 'live' : k?.includes('_test_') ? 'test' : '');

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private integrations: IntegrationsService, private mail: MailService) {}

  @Get()
  status() {
    return this.integrations.status();
  }

  @Audit({
    action: 'PAYSTACK_KEYS_CHANGED',
    entity: 'Integration',
    summary: ({ body }) => {
      const parts = [body?.secretKey && 'secret key', body?.publicKey && 'public key'].filter(Boolean).join(' and ');
      const m = mode(body?.secretKey || body?.publicKey);
      return `Saved Paystack ${parts || 'settings'}${m ? ` (${m} mode)` : ''}`;
    },
  })
  @Put('paystack')
  savePaystack(@Body() body: { secretKey?: string; publicKey?: string }, @Request() req: any) {
    return this.integrations.savePaystack(body ?? {}, req.user.email);
  }

  @Audit({
    action: 'RESEND_SETTINGS_CHANGED',
    entity: 'Integration',
    summary: ({ body }) =>
      [body?.apiKey && 'Saved a new Resend API key', body?.mailFrom && `Set email sender to ${body.mailFrom}`].filter(Boolean).join('; ') ||
      'Saved Resend settings',
  })
  @Put('resend')
  saveResend(@Body() body: { apiKey?: string; mailFrom?: string }, @Request() req: any) {
    return this.integrations.saveResend(body ?? {}, req.user.email);
  }

  /** Revert to the server's environment values. */
  @Audit({
    action: 'INTEGRATION_RESET',
    entity: 'Integration',
    summary: ({ params }) => `Removed saved ${params.provider === 'paystack' ? 'Paystack' : 'Resend'} keys (back to server defaults)`,
  })
  @Delete(':provider')
  async clear(@Param('provider') provider: string) {
    if (provider !== 'paystack' && provider !== 'resend') throw new BadRequestException('Unknown provider');
    await this.integrations.clear(provider);
    return this.integrations.status();
  }

  @Audit({ action: 'TEST_EMAIL_SENT', entity: 'Integration', summary: ({ result }) => `Sent a test email to ${result?.to}` })
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
