import type { AppConfig } from '../config.js';

export type EmailAction = 'verify_email' | 'reset_password';
export type DeliveryStatus = 'sent' | 'preview' | 'unavailable' | 'failed';

export interface EmailMessage {
  to: string;
  displayName: string;
  action: EmailAction;
  actionUrl: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<DeliveryStatus>;
}

export class DisabledEmailProvider implements EmailProvider {
  public async send(_message: EmailMessage): Promise<DeliveryStatus> {
    return 'unavailable';
  }
}

export class ConsoleDevelopmentEmailProvider implements EmailProvider {
  public constructor(nodeEnv: AppConfig['nodeEnv']) {
    if (nodeEnv === 'production') throw new Error('Console email delivery cannot run in production.');
  }

  public async send(_message: EmailMessage): Promise<DeliveryStatus> {
    // Tokens and recipient data are deliberately not written to process logs.
    return 'preview';
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

export class ResendEmailProvider implements EmailProvider {
  public constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly timeoutMs = 5_000,
  ) {}

  public async send(message: EmailMessage): Promise<DeliveryStatus> {
    const isVerification = message.action === 'verify_email';
    const subject = isVerification ? 'Verify your AstroTalk email' : 'Reset your AstroTalk password';
    const verb = isVerification ? 'Verify email' : 'Reset password';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject,
          html: `<p>Hello ${escapeHtml(message.displayName)},</p><p><a href="${escapeHtml(message.actionUrl)}">${verb}</a></p><p>If you did not request this, you can ignore this email.</p>`,
          text: `Hello ${message.displayName},\n\n${verb}: ${message.actionUrl}\n\nIf you did not request this, you can ignore this email.`,
        }),
        signal: controller.signal,
      });
      return response.ok ? 'sent' : 'failed';
    } catch {
      return 'failed';
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createEmailProvider(config: AppConfig): EmailProvider {
  if (config.emailDeliveryMode === 'console') return new ConsoleDevelopmentEmailProvider(config.nodeEnv);
  if (config.emailDeliveryMode === 'resend') {
    if (!config.resendApiKey || !config.emailFrom) throw new Error('Resend email configuration is incomplete.');
    return new ResendEmailProvider(config.resendApiKey, config.emailFrom, config.oauthHttpTimeoutMs);
  }
  return new DisabledEmailProvider();
}
