import { Injectable, Logger } from '@nestjs/common';

const WEBHOOK_TIMEOUT = 10_000;

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  async send(webhookUrl: string, payload: Record<string, unknown>, secret?: string): Promise<void> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) {
      headers['Authorization'] = secret;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT);

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok && res.status >= 300) {
        const text = await res.text().catch(() => '');
        this.logger.warn(`Webhook returned ${res.status}: ${text}`);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new Error('Webhook request timed out');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
