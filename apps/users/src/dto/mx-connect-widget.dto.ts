import {
    IsBoolean,
    IsOptional,
    IsString,
  } from 'class-validator';
  
  export class MxConnectWidgetDTO {
   
    @IsOptional()
    @IsString()
    userGuid?:string;
  
  }
  