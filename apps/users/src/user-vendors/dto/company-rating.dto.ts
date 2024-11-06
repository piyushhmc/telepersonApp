import { IsNotEmpty, IsNumber } from "class-validator";

export class CompanyRatingDto {
    @IsNumber()
    @IsNotEmpty()
    vendorId: number;
    @IsNumber()
    @IsNotEmpty()
    rating: number;
}
