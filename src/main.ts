import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import type { Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /**
   * Local public upload serving supports development/MVP vehicle images.
   * Production can replace LocalStorageService with S3/R2/Supabase/Azure and
   * stop serving files from this process.
   */
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  const configService = app.get(ConfigService);

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));
  app.enableCors({
    origin: getAllowedCorsOrigins(configService),
    credentials: true,
  });
  app.enableShutdownHooks();
  app.useGlobalFilters(new HttpExceptionFilter(configService));
  app.useGlobalInterceptors(new RequestLoggerInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app
    .getHttpAdapter()
    .getInstance()
    .get('/', (_req: Request, res: Response) => {
      res.redirect('/api');
    });

  const swaggerEnabled = configService.getOrThrow<boolean>('SWAGGER_ENABLED');

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Lance Certo API')
      .setDescription(
        'Sistema para gestão de leilões de veículos, avaliação de custos e controle de arremates.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
  }

  await app.listen(configService.getOrThrow<number>('PORT'));
}

void bootstrap();

function getAllowedCorsOrigins(configService: ConfigService): string[] {
  const configuredOrigins =
    configService.get<string>('CORS_ORIGIN') ??
    configService.getOrThrow<string>('APP_FRONTEND_URL');

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
