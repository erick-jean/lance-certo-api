import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Redirect root to /api
  app.getHttpAdapter().get('/', (req, res) => {
    res.redirect('/api');
  });

  const config = new DocumentBuilder()
    .setTitle('Lance Certo API')
    .setDescription(
      'Sistema para gestão de leilões de veículos, avaliação de custos e controle de arremates.',
    )
    .setVersion('1.0.0')
    .addBearerAuth() // JWT
    .addTag('auth', 'Autenticação')
    .addTag('users', 'Usuários')
    .addTag('auctions', 'Leilões')
    .addTag('vehicles', 'Veículos')
    .addTag('financial', 'Controle financeiro')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
