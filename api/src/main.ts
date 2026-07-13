import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { AuthSocketAdapter } from './chat/auth-socket.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // enable CORS for frontend application
  app.enableCors({
    // Frontend domenlari: cookie/credentials ishlashi uchun ikkalasini ham allowed qilamiz.
    origin: ['https://court-community1.onrender.com', 'https://court-community.onrender.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization',
  });

  // Security: Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that are not in the DTO
      forbidNonWhitelisted: true, // Throw an error if non-DTO properties are sent
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  app.use(cookieParser());

  app.useWebSocketAdapter(new AuthSocketAdapter(app));

  await app.listen(process.env.PORT ?? 5001);
  console.log(`Server is running on http://localhost:${process.env.PORT ?? 5001}`);
}
bootstrap();
