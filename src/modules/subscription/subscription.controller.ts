import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { createHmac, timingSafeEqual } from 'crypto';
import { AuthGuard } from '../auth/auth.guard';
import { MessageResponseDto } from '../auth/dto/message-response.dto';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionUsageResponseDto } from './dto/subscription-usage-response.dto';
import { SubscriptionWebhookDto } from './dto/subscription-webhook.dto';
import { SubscriptionService } from './subscription.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { MercadoPagoWebhookDto } from './dto/mercado-pago-webhook.dto';

@ApiTags('Subscription / Assinatura')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna plano atual do usuário.' })
  @ApiOkResponse({ type: SubscriptionResponseDto })
  findCurrent(
    @Req() request: AuthenticatedRequest,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.findCurrentSubscription(request.user.sub);
  }

  @Get('usage')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna uso atual e limites do plano.' })
  @ApiOkResponse({ type: SubscriptionUsageResponseDto })
  usage(
    @Req() request: AuthenticatedRequest,
  ): Promise<SubscriptionUsageResponseDto> {
    return this.subscriptionService.findSubscriptionUsage(request.user.sub);
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia pagamento ou assinatura.' })
  @ApiBody({ type: CreateCheckoutDto })
  @ApiOkResponse({ type: CheckoutResponseDto })
  checkout(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.subscriptionService.createCheckout(
      request.user.sub,
      request.user.email,
      dto.cardTokenId,
    );
  }

  @Post('cancel')
  @Throttle({ default: { limit: 5, ttl: 60_000, blockDuration: 300_000 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela assinatura.' })
  @ApiOkResponse({ type: SubscriptionResponseDto })
  cancel(
    @Req() request: AuthenticatedRequest,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.cancel(request.user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 300_000 } })
  @ApiOperation({ summary: 'Recebe eventos do gateway de pagamento.' })
  @ApiOkResponse({ type: MessageResponseDto })
  webhook(
    @Headers('x-webhook-secret') webhookSecret: string | undefined,
    @Body() dto: SubscriptionWebhookDto,
  ): Promise<MessageResponseDto> {
    this.validateWebhookSecret(webhookSecret);
    return this.subscriptionService.applySubscriptionWebhookEvent(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('webhook/mercado-pago')
  @Throttle({ default: { limit: 120, ttl: 60_000, blockDuration: 300_000 } })
  @ApiOperation({ summary: 'Recebe webhooks oficiais do Mercado Pago.' })
  @ApiOkResponse({ type: MessageResponseDto })
  mercadoPagoWebhook(
    @Headers('x-signature') signature: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
    @Query('data.id') queryDataId: string | undefined,
    @Body() dto: MercadoPagoWebhookDto,
  ): Promise<MessageResponseDto> {
    this.validateMercadoPagoSignature(signature, requestId, queryDataId);

    return this.subscriptionService.applyMercadoPagoWebhookEvent(dto);
  }

  private validateWebhookSecret(webhookSecret: string | undefined): void {
    const expectedSecret = this.configService.getOrThrow<string>(
      'SUBSCRIPTION_WEBHOOK_SECRET',
    );

    // TODO: replace shared-secret webhook verification with provider signature verification before production.
    if (!this.secureEquals(webhookSecret, expectedSecret)) {
      throw new UnauthorizedException('Segredo do webhook inválido');
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

  private validateMercadoPagoSignature(
    signature: string | undefined,
    requestId: string | undefined,
    dataId: string | undefined,
  ): void {
    const expectedSecret =
      this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET') ??
      this.configService.getOrThrow<string>('SUBSCRIPTION_WEBHOOK_SECRET');

    const signatureParts = this.parseMercadoPagoSignature(signature);

    if (!requestId || !signatureParts.ts || !signatureParts.v1) {
      throw new UnauthorizedException(
        'Assinatura do Mercado Pago ausente ou invÃ¡lida',
      );
    }

    const manifest = this.buildMercadoPagoManifest({
      dataId,
      requestId,
      timestamp: signatureParts.ts,
    });
    const expectedHash = createHmac('sha256', expectedSecret)
      .update(manifest)
      .digest('hex');

    if (!this.secureEquals(signatureParts.v1, expectedHash)) {
      throw new UnauthorizedException(
        'Assinatura do Mercado Pago invÃ¡lida',
      );
    }
  }

  private parseMercadoPagoSignature(
    signature: string | undefined,
  ): Record<string, string> {
    if (!signature) {
      return {};
    }

    return signature.split(',').reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split('=').map((item) => item.trim());

      if (key && value) {
        acc[key] = value;
      }

      return acc;
    }, {});
  }

  private buildMercadoPagoManifest(params: {
    dataId: string | undefined;
    requestId: string;
    timestamp: string;
  }): string {
    const normalizedDataId = params.dataId?.toLowerCase();

    return [
      normalizedDataId ? `id:${normalizedDataId};` : '',
      `request-id:${params.requestId};`,
      `ts:${params.timestamp};`,
    ].join('');
  }
}
