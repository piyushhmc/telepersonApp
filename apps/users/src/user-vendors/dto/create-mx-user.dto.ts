import { IsString } from "class-validator";

export class CreateMXUserDto {
    @IsString()
    id: string;
    @IsString()
    email: string;
    @IsString()
    firstName: string;
    @IsString()
    lastName: string;

}
