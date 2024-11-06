import { Module } from '@nestjs/common';
import { UserVendorsController } from './user-vendors.controller';
import {
  DatabaseModule,
  LoggerModule,
  AUTH_SERVICE,
  HealthModule,
} from '@app/common';
import { UserVenndorsRepository } from './user-vendors.repository';
import { UserVendors } from './models/user-vendors.entity';
import { Vendors } from './models/vendors.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { UserVendorsService } from './user-vendors.service';
import { VenndorsRepository } from './vendors.repository';
import { Common } from '../utils/common';
import{VenndorIntentsRepository} from './vendor-intents.repository';
import { VendorIntents } from './models/vendor-intent.entity';
import { IntentsRepository } from './intents.repository';
import { Intents } from './models/intent.entity';
import { CompanyRating } from './models/company-rating';
import { TelepersonRating } from './models/teleperson-rating';
import { VendorLocation } from './models/vendor-location.entity';
import { VenndorLocationRepository } from './vendor-location.repository';
import { MXPLATFORMModule } from '../mx-platform/mx-platform.module';


@Module({
  imports:[
    DatabaseModule,
    DatabaseModule.forFeature([UserVendors,Vendors,VendorIntents,Intents,CompanyRating,TelepersonRating,VendorLocation]),
    LoggerModule,
    MXPLATFORMModule,
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
  ],
  controllers: [UserVendorsController],
  providers: [UserVenndorsRepository, UserVendorsService,VenndorsRepository,
    Common,VenndorIntentsRepository,IntentsRepository,VenndorLocationRepository],
  exports: [UserVendorsService],
})


export class UserVendorsModule {}

