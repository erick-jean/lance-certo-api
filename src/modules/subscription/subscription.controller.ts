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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../auth/auth.guard';
import { MessageResponseDto } from '../auth/dto/message-response.dto';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { MercadoPagoService } from '../mercado-pago/mercado-pago.service';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { MercadoPagoWebhookDto } from './dto/mercado-pago-webhook.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionUsageResponseDto } from './dto/subscription-usage-response.dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('Subscription / Assinatura')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna plano atual do usuario.' })
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
    this.mercadoPagoService.validateWebhookSignature({
      signature,
      requestId,
      dataId: queryDataId,
    });

    return this.subscriptionService.applyMercadoPagoWebhookEvent(dto);
  }
}
