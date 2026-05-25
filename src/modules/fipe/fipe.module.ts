import { Module } from '@nestjs/common';
import { FipeService } from './fipe.service';
import { FipeController } from './fipe.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FipeController],
  providers: [FipeService],
})
export class FipeModule {}
