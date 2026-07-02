import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

export interface BrandConfig {
  name: string;
  logoUrl?: string | null;
  primaryColor?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resendApiKey: string;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY') || '';
    this.fromEmail =
      this.configService.get<string>('FROM_EMAIL') || 'noreply@interviewos.app';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  private get isEnabled(): boolean {
    return !!this.resendApiKey && this.resendApiKey !== 'mock-resend-key';
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
    branding?: BrandConfig,
  ): Promise<void> {
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${token}`;
    const brandName = branding?.name || 'InterviewOS';

    if (!this.isEnabled) {
      this.logger.log(`[MOCK EMAIL] Password reset for ${email}:`);
      this.logger.log(`  To: ${email}`);
      this.logger.log(`  Reset link: ${resetLink}`);
      return;
    }

    const html = this.buildTemplate({
      previewText: `Reset your ${brandName} password`,
      headline: 'Reset your password',
      greeting: `Hi ${name},`,
      body: `We received a request to reset your ${brandName} account password. Click the button below to choose a new one. This link expires in 1 hour.`,
      ctaText: 'Reset Password',
      ctaUrl: resetLink,
      footerNote:
        'If you did not request a password reset, you can safely ignore this email.',
      branding,
    });

    await this.send({
      to: email,
      subject: `Reset your ${brandName} password`,
      html,
    });
  }

  async sendEmailVerification(
    email: string,
    name: string,
    token: string,
    branding?: BrandConfig,
  ): Promise<void> {
    const verifyLink = `${this.frontendUrl}/auth/verify-email?token=${token}`;
    const brandName = branding?.name || 'InterviewOS';

    if (!this.isEnabled) {
      this.logger.log(`[MOCK EMAIL] Email verification for ${email}:`);
      this.logger.log(`  To: ${email}`);
      this.logger.log(`  Verify link: ${verifyLink}`);
      return;
    }

    const html = this.buildTemplate({
      previewText: `Verify your ${brandName} email address`,
      headline: 'Verify your email',
      greeting: `Hi ${name},`,
      body: `Thanks for creating a ${brandName} account! Click the button below to verify your email address. This link expires in 24 hours.`,
      ctaText: 'Verify Email',
      ctaUrl: verifyLink,
      footerNote:
        'If you did not create an account, you can safely ignore this email.',
      branding,
    });

    await this.send({
      to: email,
      subject: `Verify your ${brandName} email address`,
      html,
    });
  }

  async sendInterviewInvitation(
    email: string,
    name: string,
    interviewTitle: string,
    scheduledTime: Date,
    interviewLink: string,
    branding?: BrandConfig,
    calendarData?: {
      googleUrl: string;
      outlookUrl: string;
      icsBuffer?: Buffer | null;
    },
  ): Promise<void> {
    const formattedDate = scheduledTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = scheduledTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    if (!this.isEnabled) {
      this.logger.log(`[MOCK EMAIL] Interview invitation for ${email}:`);
      this.logger.log(`  To: ${email}`);
      this.logger.log(`  Interview: ${interviewTitle}`);
      this.logger.log(`  Date: ${formattedDate} at ${formattedTime}`);
      this.logger.log(`  Link: ${interviewLink}`);
      if (calendarData) {
        this.logger.log(`  Google Calendar: ${calendarData.googleUrl}`);
        this.logger.log(`  Outlook Calendar: ${calendarData.outlookUrl}`);
      }
      return;
    }

    const calendarButtonsHtml = calendarData
      ? `<div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)">
          <p style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 12px">Add to your calendar:</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a href="${calendarData.googleUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:12px;font-weight:500;color:rgba(255,255,255,0.8);text-decoration:none">
              📅 Google Calendar
            </a>
            <a href="${calendarData.outlookUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:12px;font-weight:500;color:rgba(255,255,255,0.8);text-decoration:none">
              📅 Outlook Calendar
            </a>
          </div>
        </div>`
      : '';

    const html = this.buildTemplate({
      previewText: `You're invited to ${interviewTitle}`,
      headline: 'Interview Scheduled',
      greeting: `Hi ${name},`,
      body: `You have been invited to a technical interview: <strong>${interviewTitle}</strong>.<br><br>
        <strong style="color:#fff">${formattedDate}</strong><br>
        <strong style="color:#fff">${formattedTime}</strong><br><br>
        Please join at the scheduled time using the link below. Make sure you have a working microphone and camera.
        ${calendarButtonsHtml}`,
      ctaText: 'Join Interview',
      ctaUrl: interviewLink,
      footerNote: 'This interview will be recorded for review purposes.',
      branding,
    });

    await this.send({
      to: email,
      subject: `Interview Scheduled: ${interviewTitle}`,
      html,
      attachments: calendarData?.icsBuffer
        ? [
            {
              filename: 'interview.ics',
              content: calendarData.icsBuffer,
              contentType: 'text/calendar',
            },
          ]
        : undefined,
    });
  }

  async sendInterviewFeedbackReady(
    email: string,
    name: string,
    interviewTitle: string,
    score: number,
    reviewLink: string,
    branding?: BrandConfig,
  ): Promise<void> {
    if (!this.isEnabled) {
      this.logger.log(`[MOCK EMAIL] Feedback ready for ${email}:`);
      this.logger.log(`  To: ${email}`);
      this.logger.log(`  Interview: ${interviewTitle}`);
      this.logger.log(`  Score: ${score}`);
      this.logger.log(`  Review link: ${reviewLink}`);
      return;
    }

    const scoreColor =
      score >= 80 ? '#30d158' : score >= 60 ? '#ff9f0a' : '#ff453a';
    const brandName = branding?.name || 'InterviewOS';

    const html = this.buildTemplate({
      previewText: `Your interview feedback is ready`,
      headline: 'Interview Feedback Ready',
      greeting: `Hi ${name},`,
      body: `The AI-powered evaluation for <strong>${interviewTitle}</strong> is complete.<br><br>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:16px auto;text-align:center">
          <tr>
            <td style="background:${scoreColor};border-radius:9999px;padding:8px 24px;font-size:24px;font-weight:700;color:#000;letter-spacing:-0.5px">
              Score: ${score}/100
            </td>
          </tr>
        </table>
        <p style="color:#a1a1a6;font-size:14px;line-height:1.5;margin:8px 0">
          Review the full analysis, code playback, and detailed feedback.
        </p>`,
      ctaText: 'View Feedback',
      ctaUrl: reviewLink,
      footerNote: `You can also view this feedback from your ${brandName} dashboard.`,
      branding,
    });

    await this.send({
      to: email,
      subject: `Feedback Ready: ${interviewTitle}`,
      html,
    });
  }

  async sendInterviewReminder(
    email: string,
    name: string,
    interviewTitle: string,
    scheduledTime: Date,
    interviewLink: string,
    branding?: BrandConfig,
  ): Promise<void> {
    const brandName = branding?.name || 'InterviewOS';
    const formattedTime = scheduledTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    if (!this.isEnabled) {
      this.logger.log(`[MOCK EMAIL] Interview reminder for ${email}:`);
      this.logger.log(`  Interview: ${interviewTitle} at ${formattedTime}`);
      return;
    }

    const html = this.buildTemplate({
      previewText: `Reminder: ${interviewTitle} starts soon`,
      headline: 'Interview Starting Soon',
      greeting: `Hi ${name},`,
      body: `This is a friendly reminder that your interview <strong>${interviewTitle}</strong> is scheduled to begin at <strong style="color:#fff">${formattedTime}</strong>.<br><br>
        Please make sure your microphone and camera are working, and join a few minutes early.`,
      ctaText: 'Join Interview',
      ctaUrl: interviewLink,
      footerNote: `You are receiving this because you have reminders enabled in your ${brandName} notification settings.`,
      branding,
    });

    await this.send({
      to: email,
      subject: `Reminder: ${interviewTitle} starts soon`,
      html,
    });
  }

  async sendInterviewCancelled(
    email: string,
    name: string,
    interviewTitle: string,
    scheduledTime: Date,
    branding?: BrandConfig,
  ): Promise<void> {
    const brandName = branding?.name || 'InterviewOS';
    const formattedDate = scheduledTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!this.isEnabled) {
      this.logger.log(`[MOCK EMAIL] Interview cancelled for ${email}:`);
      this.logger.log(`  Interview: ${interviewTitle}`);
      return;
    }

    const html = this.buildTemplate({
      previewText: `Cancelled: ${interviewTitle}`,
      headline: 'Interview Cancelled',
      greeting: `Hi ${name},`,
      body: `The interview <strong>${interviewTitle}</strong> previously scheduled for <strong style="color:#fff">${formattedDate}</strong> has been cancelled.<br><br>
        If you believe this was done in error, please contact the interviewer directly.`,
      ctaText: 'View Dashboard',
      ctaUrl: `${this.frontendUrl}/dashboard`,
      footerNote: `You are receiving this because you were a participant in this ${brandName} interview.`,
      branding,
    });

    await this.send({
      to: email,
      subject: `Cancelled: ${interviewTitle}`,
      html,
    });
  }

  async sendInterviewRescheduled(
    email: string,
    name: string,
    interviewTitle: string,
    oldTime: Date,
    newTime: Date,
    interviewLink: string,
    branding?: BrandConfig,
  ): Promise<void> {
    const brandName = branding?.name || 'InterviewOS';
    const formatOpts: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    };

    if (!this.isEnabled) {
      this.logger.log(`[MOCK EMAIL] Interview rescheduled for ${email}:`);
      this.logger.log(`  Interview: ${interviewTitle}`);
      this.logger.log(
        `  Old: ${oldTime.toLocaleString()} -> New: ${newTime.toLocaleString()}`,
      );
      return;
    }

    const html = this.buildTemplate({
      previewText: `Rescheduled: ${interviewTitle}`,
      headline: 'Interview Rescheduled',
      greeting: `Hi ${name},`,
      body: `The interview <strong>${interviewTitle}</strong> has been rescheduled.<br><br>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;width:100%">
          <tr>
            <td style="padding:8px 12px;background:#1c1c1e;border-radius:8px;font-size:13px;color:#ff453a;text-decoration:line-through">
              ${oldTime.toLocaleString('en-US', formatOpts)}
            </td>
          </tr>
          <tr><td style="height:8px"></td></tr>
          <tr>
            <td style="padding:8px 12px;background:#1c1c1e;border-radius:8px;font-size:13px;color:#30d158;font-weight:600">
              ${newTime.toLocaleString('en-US', formatOpts)}
            </td>
          </tr>
        </table>
        Please update your calendar accordingly.`,
      ctaText: 'View Interview',
      ctaUrl: interviewLink,
      footerNote: `You are receiving this because you were a participant in this ${brandName} interview.`,
      branding,
    });

    await this.send({
      to: email,
      subject: `Rescheduled: ${interviewTitle}`,
      html,
    });
  }

  private async send(payload: EmailPayload): Promise<void> {
    if (!this.isEnabled) return;

    const { Resend } = await import('resend');
    const resend = new Resend(this.resendApiKey);

    const result = await resend.emails.send({
      from: this.fromEmail,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      attachments: payload.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString('base64'),
        contentType: a.contentType,
      })),
    });

    if (result.error) {
      throw new Error(
        `Resend API error: ${result.error.message || JSON.stringify(result.error)}`,
      );
    }

    this.logger.log(
      `Email sent to ${payload.to}: ${payload.subject} (id: ${result.data?.id || 'unknown'})`,
    );
  }

  private buildTemplate(opts: {
    previewText: string;
    headline: string;
    greeting: string;
    body: string;
    ctaText: string;
    ctaUrl: string;
    footerNote: string;
    branding?: BrandConfig;
  }): string {
    const brandName = opts.branding?.name || 'InterviewOS';
    const brandColor = opts.branding?.primaryColor || '#0066cc';
    const logoHtml = opts.branding?.logoUrl
      ? `<img src="${opts.branding.logoUrl}" alt="${brandName}" style="max-height:32px;margin-bottom:32px" />`
      : `<span style="font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#fff">${brandName}</span>`;

    return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;background:#000">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <!--[if !mso]><!-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  </style>
  <!--<![endif]-->
  <title>${opts.headline}</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:'Inter','SF Pro Text',system-ui,-apple-system,sans-serif;color:#fff">
  <!-- Preview text -->
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
    ${opts.previewText}
  </div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#000;min-width:100%">
    <tr>
      <td align="center" style="padding:40px 16px 32px">

        <!-- Logo -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px">
          <tr>
            <td style="font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#fff">
              ${logoHtml}
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#1c1c1e;border-radius:18px;overflow:hidden">
          <tr>
            <td style="padding:40px 32px 32px">

              <!-- Headline -->
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;line-height:1.3;letter-spacing:-0.3px;color:#fff">
                ${opts.headline}
              </h1>

              <!-- Greeting -->
              <p style="margin:16px 0;font-size:15px;line-height:1.5;color:#a1a1a6">
                ${opts.greeting}
              </p>

              <!-- Body -->
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a1a1a6">
                ${opts.body}
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px">
                <tr>
                  <td align="center" style="background:${brandColor};border-radius:9999px;padding:0">
                    <a href="${opts.ctaUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:500;line-height:1;color:#fff;text-decoration:none;border-radius:9999px">
                      ${opts.ctaText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer note -->
              <p style="margin:0;font-size:12px;line-height:1.4;color:#636366">
                ${opts.footerNote}
              </p>

            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px">
          <tr>
            <td style="font-size:11px;line-height:1.3;color:#48484a;text-align:center">
              <p style="margin:0 0 4px">${brandName} — AI-Powered Technical Interviews</p>
              <p style="margin:0">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
