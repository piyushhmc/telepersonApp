import { IsNotEmpty, IsNumber } from "class-validator";

export class TelepersonRatingDto {
    @IsNumber()
    @IsNotEmpty()
    vendorId: number;
    @IsNumber()
    @IsNotEmpty()
    rating: number;
}
