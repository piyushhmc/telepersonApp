import {
  IsBoolean,
  IsString,
} from 'class-validator';



export class CreateVendorDto {
  @IsString()
  companyCode: string;
  @IsString()
  companyName: string;
  @IsString()
  websiteUrl: string;
  @IsString()
  logoUrl: string;
  @IsBoolean()
  isMX: boolean;
}