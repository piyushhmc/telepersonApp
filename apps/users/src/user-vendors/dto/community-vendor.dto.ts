
//user.dto.ts
export class CommunityUserDto {
  readonly userVendorId: number;
  readonly userId: number;
  readonly profileImage: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly facebook: string;
  readonly linkedin: string;
  readonly twitter: string;
  readonly instagram: string;
}

// vendor.dto.ts
export class CommunityVendorDto {
  readonly userVendorId: number;
  readonly vendorId: number;
  readonly name: string;
  readonly logo: string;
}