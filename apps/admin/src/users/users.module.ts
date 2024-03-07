import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User } from '@app/common'

import {
  DatabaseModule,
  LoggerModule,
  AUTH_SERVICE,
  HealthModule,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Common } from '../utils/common';

@Module({
  imports: [
  DatabaseModule,
  DatabaseModule.forFeature([User]),
  LoggerModule,
  ClientsModule.registerAsync([
    {
      name: AUTH_SERVICE,
      useFactory: (configService: ConfigService) => ({
        transport: Transport.TCP,
        options: {
          host: configService.get('AUTH_HOST'),
          port: configService.get('AUTH_PORT'),
        },
      }),
      inject: [ConfigService],
    },
  ]),
  HealthModule,
],
  controllers: [UsersController],
  providers: [UsersService,UsersRepository,Common]
})
export class UsersModule {}
