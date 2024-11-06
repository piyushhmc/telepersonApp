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
import { VendorIntents } from './models/vendor-intent.entity';
import { UserVendors } from './models/user-vendors.entity';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([Vendors,Intents,VendorIntents,UserVendors]),
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
    S3Module,
  ],
  controllers: [VendorsController],
  providers: [VendorsService, VendorRepository,IntentRepository,Common],
})


export class VendorsModule {}

