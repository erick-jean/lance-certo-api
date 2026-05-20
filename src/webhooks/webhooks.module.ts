import { Module } from '@nestjs/common';
import { MercadoPagoModule } from 'src/modules/mercado-pago/mercado-pago.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [MercadoPagoModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
