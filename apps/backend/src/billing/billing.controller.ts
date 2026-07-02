import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';

type AuthRequest = Request & {
  user: { id: string; email: string; role: string; name: string };
};

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Req() req: AuthRequest,
    @Body() body: { plan: string; interval?: string },
  ) {
    return this.billingService.createCheckoutSession(
      req.user.id,
      req.user.email,
      body.plan,
      body.interval,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-portal-session')
  async createPortalSession(@Req() req: AuthRequest) {
    return this.billingService.createPortalSession(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  async getSubscription(@Req() req: AuthRequest) {
    return this.billingService.getSubscription(req.user.id);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody!, signature);
  }
}
