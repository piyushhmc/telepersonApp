import {
    IsNumber,
  } from 'class-validator';
import { PrimaryGeneratedColumn } from 'typeorm';
  
  export class TwiliologsDto {

    @PrimaryGeneratedColumn()
    id: number;

    @IsNumber()
    userId: number;

    @IsNumber()
    vendorId: number;

    @IsNumber()
    vendorIntentId: number;

  }