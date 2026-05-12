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
import { EvalutionVehicleModule } from './modules/evaluations/evalution-vehicle.module';

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
    EvalutionVehicleModule,
    ChecklistModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
