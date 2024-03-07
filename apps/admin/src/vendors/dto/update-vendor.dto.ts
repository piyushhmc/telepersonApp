import {
  IsBoolean,
  IsNumber,
  IsString,
} from 'class-validator';

export class UpdateVendorDto {
  @IsNumber()
  "vendorCreatedBy": number;
  @IsString()
  "companyCode": string;
  @IsString()
  "companyName": string;
  @IsString()
  "contactNumber": string;
  @IsString()
  "industry": string;
  @IsString()
  "street1": string;
  @IsString()
  "city": string;
  @IsString()
  "state": string;
  @IsString()
  "zip": string;
  @IsString()
  "country": string;
  @IsString()
  "companyOverview": string;
  @IsString()
  "websiteURL": string;
  @IsString()
  "revenue": string;
  @IsNumber()
  "employees": number;
  @IsString()
  "linkedin": string;
  @IsString()
  "subIndustry": string;
  @IsString()
  "logoUrl": string;
  @IsString()
  "foundedYear": string;
  @IsString()
  "approvalStatus": string;
  @IsBoolean()
  "isMX": boolean
  @IsNumber()
  "isPopular": number;
  @IsNumber()
  "isCommunityVendor": number;
  @IsNumber()
  "isdefaultVendor": number;
}
