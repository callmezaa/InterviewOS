import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Plan } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const Stripe = require('stripe');
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2025-03-31',
      },
    );
  }

  private getPriceId(plan: string, interval?: string): string | null {
    if (interval === 'yearly') {
      const yearlyKey = `STRIPE_PRICE_${plan.toUpperCase()}_YEARLY`;
      const yearlyPriceId = this.configService.get<string>(yearlyKey);
      if (yearlyPriceId) return yearlyPriceId;
    }
    const key = `STRIPE_PRICE_${plan.toUpperCase()}`;
    const priceId = this.configService.get<string>(key);
    return priceId || null;
  }

  async createCheckoutSession(
    userId: string,
    userEmail: string,
    plan: string,
    interval?: string,
  ) {
    const effectiveInterval = interval === 'yearly' ? 'yearly' : 'monthly';
    const priceId = this.getPriceId(plan, effectiveInterval);
    if (!priceId) {
      throw new BadRequestException(`No price configured for plan: ${plan}`);
    }

    let customerId: string | null = null;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.stripeCustomerId) {
      customerId = user.stripeCustomerId;
    }

    const session = await this.stripe.checkout.sessions.create({
      ...(customerId
        ? { customer: customerId }
        : { customer_email: userEmail }),
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, billingInterval: effectiveInterval },
      success_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/settings/billing?checkout=success`,
      cancel_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/settings/billing?checkout=canceled`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId, billingInterval: effectiveInterval },
      },
    });

    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No active subscription found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/settings/billing`,
    });

    return { url: session.url };
  }

  async getSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        billingInterval: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        trialEndsAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret || webhookSecret === 'whsec_placeholder') {
      this.logger.warn(
        'Stripe webhook secret not configured, skipping webhook processing',
      );
      return { received: true };
    }

    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: any) {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.warn('Checkout session missing userId metadata');
      return;
    }

    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      this.logger.warn('Checkout session missing subscription ID');
      return;
    }

    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    const plan = this.mapStripePriceToPlan(
      subscription.items.data[0]?.price?.id,
    );
    const billingInterval = subscription.metadata?.billingInterval || 'monthly';

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: session.customer,
        stripeSubscriptionId: subscriptionId,
        plan,
        billingInterval,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    this.logger.log(
      `User ${userId} subscribed to plan: ${plan} (${billingInterval})`,
    );
  }

  private async handleSubscriptionUpdated(subscription: any) {
    const billingInterval = subscription.metadata?.billingInterval || 'monthly';
    const plan = this.mapStripePriceToPlan(
      subscription.items.data[0]?.price?.id,
    );
    const userId = subscription.metadata?.userId;
    if (!userId) {
      const user = await this.prisma.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!user) {
        this.logger.warn(`No user found for subscription ${subscription.id}`);
        return;
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          plan,
          billingInterval,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        plan,
        billingInterval,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    this.logger.log(
      `User ${userId} subscription updated to: ${plan} (${subscription.status}, ${billingInterval})`,
    );
  }

  private async handleSubscriptionDeleted(subscription: any) {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      const user = await this.prisma.user.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!user) return;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          plan: Plan.FREE,
          stripeSubscriptionId: null,
          subscriptionStatus: 'canceled',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: Plan.FREE,
        stripeSubscriptionId: null,
        subscriptionStatus: 'canceled',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    this.logger.log(`User ${userId} subscription canceled`);
  }

  private async handleInvoicePaid(invoice: any) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    await this.prisma.user.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        subscriptionStatus: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    this.logger.log(`Invoice paid for subscription ${subscriptionId}`);
  }

  private async handleInvoicePaymentFailed(invoice: any) {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    await this.prisma.user.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { subscriptionStatus: 'past_due' },
    });

    this.logger.warn(`Payment failed for subscription ${subscriptionId}`);
  }

  private mapStripePriceToPlan(priceId: string): Plan {
    const configService = this.configService;
    const plans: Record<string, Plan> = {
      [configService.get('STRIPE_PRICE_FREE') || '']: Plan.FREE,
      [configService.get('STRIPE_PRICE_PRO') || '']: Plan.PRO,
      [configService.get('STRIPE_PRICE_PRO_YEARLY') || '']: Plan.PRO,
      [configService.get('STRIPE_PRICE_TEAM') || '']: Plan.TEAM,
      [configService.get('STRIPE_PRICE_TEAM_YEARLY') || '']: Plan.TEAM,
      [configService.get('STRIPE_PRICE_ENTERPRISE') || '']: Plan.ENTERPRISE,
    };
    return plans[priceId] || Plan.PRO;
  }
}
