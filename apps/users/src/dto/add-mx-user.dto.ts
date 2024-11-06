import {
  IsBoolean,
  IsString,
} from 'class-validator';

export class MxUserDto {
 
  @IsString()
  usrGuid:string;

  @IsBoolean()
  isMX:boolean;
}
