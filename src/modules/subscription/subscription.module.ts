import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MercadoPagoModule } from '../mercado-pago/mercado-pago.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [AuthModule, MercadoPagoModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}
