import {
  IsJSON,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateVendorDto {
  @IsString()
  companyName: string;
  @IsString()
  contactNumber: string;
  @IsString()
  companyOverview?: string;
  @IsString()
  street1: string;
  @IsString()
  city: string;
  @IsString()
  state: string;
  @IsString()
  zip: string;
  @IsString()
  country: string;
  @IsString()
  industry?: string;
  @IsString()
  subIndustry?: string;
  @IsString()
  websiteUrl?: string;
  @IsString()
  linkedin?: string;
  @IsString()
  founded?: string;
  @IsString()
  revenue?: string;
  @IsNumber()
  employees?: number;
  @IsString()
  facebook?: string;  
  @IsString()
  twitter?: string; 
   @IsString()
  instagram?: string;
}
