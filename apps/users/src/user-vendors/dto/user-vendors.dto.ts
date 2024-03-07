import {
    IsBoolean,
    IsDate,
    IsNumber,
  } from 'class-validator';
  

  
  export class UserVenndorsDto {
    @IsNumber()
    userId: number;

    @IsNumber()
    vendorId: number;

    @IsNumber()
    isPlaidLinked: number;

    @IsDate()
    plaidLinkedDate: Date;

    @IsDate()
    assignedDate: Date;

    @IsBoolean()
    isActive: boolean;

  }
  