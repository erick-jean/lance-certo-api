import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: StorageService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): StorageService => {
        const provider = configService.get<string>('STORAGE_PROVIDER', 'local');

        if (provider === 'supabase') {
          return new SupabaseStorageService(configService);
        }

        return new LocalStorageService();
      },
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
