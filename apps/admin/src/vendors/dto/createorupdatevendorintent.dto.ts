import {
  IsBoolean,
    IsNumber,
    IsString,
  } from 'class-validator';
  
  export class CreateOrUpdateVendorIntentDto {
    @IsString()
    intentName: string;
    @IsNumber()
    vendorId: number;
    @IsString()
    algorithm: string;
    @IsString()
    buttonDescription?: string;
    @IsString()
    buttonComments: string;
    @IsString()
    status: string;
    @IsBoolean()
    isAllIntentAdded: boolean;

  
  }
  