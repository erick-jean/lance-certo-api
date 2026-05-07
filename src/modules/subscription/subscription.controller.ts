import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { timingSafeEqual } from 'crypto';
import { AuthGuard } from '../auth/auth.guard';
import { MessageResponseDto } from '../auth/dto/message-response.dto';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionWebhookDto } from './dto/subscription-webhook.dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns the current plan for the authenticated user.
   */
  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna plano atual do usuario' })
  @ApiOkResponse({ type: SubscriptionResponseDto })
  findCurrent(
    @Req() request: AuthenticatedRequest,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.findCurrent(request.user.sub);
  }

  /**
   * Starts the checkout flow for the authenticated user.
   */
  @Post('checkout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia pagamento ou assinatura' })
  @ApiOkResponse({ type: CheckoutResponseDto })
  checkout(@Req() request: AuthenticatedRequest): Promise<CheckoutResponseDto> {
    return this.subscriptionService.checkout(request.user.sub);
  }

  /**
   * Cancels renewal for the authenticated user's subscription.
   */
  @Post('cancel')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela assinatura' })
  @ApiOkResponse({ type: SubscriptionResponseDto })
  cancel(
    @Req() request: AuthenticatedRequest,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.cancel(request.user.sub);
  }

  /**
   * Receives trusted payment gateway events.
   */
  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 60_000 } })
  @ApiOperation({ summary: 'Recebe eventos do gateway de pagamento' })
  @ApiOkResponse({ type: MessageResponseDto })
  webhook(
    @Headers('x-webhook-secret') webhookSecret: string | undefined,
    @Body() dto: SubscriptionWebhookDto,
  ): Promise<MessageResponseDto> {
    this.validateWebhookSecret(webhookSecret);
    return this.subscriptionService.handleWebhook(dto);
  }

  private validateWebhookSecret(webhookSecret: string | undefined): void {
    const expectedSecret = this.configService.getOrThrow<string>(
      'SUBSCRIPTION_WEBHOOK_SECRET',
    );

    if (!this.secureEquals(webhookSecret, expectedSecret)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  private secureEquals(value: string | undefined, expected: string): boolean {
    if (!value) {
      return false;
    }

    const valueBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);

    return (
      valueBuffer.length === expectedBuffer.length &&
      timingSafeEqual(valueBuffer, expectedBuffer)
    );
  }
}
