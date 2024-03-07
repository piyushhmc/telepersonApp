import {
  IsBoolean,
    IsNumber,
  } from 'class-validator';
  

  
  export class PatchUserVenndorsDto {
   
    @IsNumber()
    vendorId: number;

    @IsBoolean()
    isActive: boolean;

  }
  