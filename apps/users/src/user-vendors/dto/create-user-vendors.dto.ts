import {
    IsNumber,
  } from 'class-validator';
  

  
  export class CreateUserVenndorsDto {
   
    @IsNumber()
    vendorId: number;
    
    @IsNumber()
    isPlaidLinked:number;

  }
  