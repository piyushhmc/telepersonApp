import { NestFactory } from '@nestjs/core';
import { UsersModule } from './users.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { Logger, LoggerModule } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(UsersModule);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
});
  const globalPrefix = "api/v1";
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useLogger(app.get(Logger));
  LoggerModule.forRoot({
    pinoHttp:{
      name:'admin-microservice',
      level:process.env.PINO_LOG_LEVEL ?? 'info',
      formatters:{
        level: label =>{
          return {level:label}
        },
      }
    }
  })
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  await app.listen(configService.get('USER_PORT'));
}

bootstrap();
