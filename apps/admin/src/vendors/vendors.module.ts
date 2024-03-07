import { Module } from '@nestjs/common';
import * as Joi from 'joi';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import {
  DatabaseModule,
  LoggerModule,
  AUTH_SERVICE,
  HealthModule,
} from '@app/common';
import { VendorRepository } from './vendors.repository';
import { Vendors } from './models/vendors.entity'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Common } from '../utils/common';
import { Intents } from './models/intent.entity'
import { IntentRepository } from './intents.repository';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([Vendors,Intents]),
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
  controllers: [VendorsController],
  providers: [VendorsService, VendorRepository,IntentRepository,Common],
})


export class VendorsModule {}

