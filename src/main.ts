import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Inlaze API')
    .setDescription(
      'Documentación a la prueba técnica de Backend con Nest de Inlaze',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // URL API DOCS
  SwaggerModule.setup('docs', app, document);
  await app.listen(3000);
}
bootstrap();
