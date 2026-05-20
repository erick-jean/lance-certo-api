import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
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
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { MessageResponseDto } from '../auth/dto/message-response.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
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
    @CurrentUser() user: JwtPayload,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.findCurrentSubscription(user.sub);
  }

  @Get('usage')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna uso atual e limites do plano.' })
  @ApiOkResponse({ type: SubscriptionUsageResponseDto })
  usage(
    @CurrentUser() user: JwtPayload,
  ): Promise<SubscriptionUsageResponseDto> {
    return this.subscriptionService.findSubscriptionUsage(user.sub);
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
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.subscriptionService.createCheckout(
      user.sub,
      user.email,
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
    @CurrentUser() user: JwtPayload,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.cancel(user.sub);
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
