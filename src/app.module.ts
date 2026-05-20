import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { validateEnv } from './config/env.validation';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { VehicleEvaluationsModule } from './modules/evaluations/vehicle-evaluations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MercadoPagoModule } from './modules/mercado-pago/mercado-pago.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
        blockDuration: 60_000,
      },
    ]),
    DatabaseModule,
    UsersModule,
    AuthModule,
    SubscriptionModule,
    VehiclesModule,
    VehicleEvaluationsModule,
    ChecklistModule,
    DashboardModule,
    ReportsModule,
    MercadoPagoModule,
    WebhooksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
