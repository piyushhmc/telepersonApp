import {
    IsNumber,
  } from 'class-validator';
  

  
  export class RemoveUserVenndorsDto {
   
    @IsNumber()
    vendorId: number;

  }
  