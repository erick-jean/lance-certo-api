import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
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
import { FipeModule } from './modules/fipe/fipe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        return {
          throttlers: [
            {
              ttl: 60_000,
              limit: 100,
              blockDuration: 60_000,
            },
          ],
          ...(redisUrl
            ? { storage: new ThrottlerStorageRedisService(redisUrl) }
            : {}),
        };
      },
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    SubscriptionModule,
    VehiclesModule,
    VehicleEvaluationsModule,
    ChecklistModule,
    DashboardModule,
    ReportsModule,
    FipeModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
