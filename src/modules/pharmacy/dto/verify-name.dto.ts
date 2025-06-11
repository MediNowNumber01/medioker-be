import { Transform } from "class-transformer";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength
} from "class-validator";

export class VerifyNamePharmacyDTO {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(3)
  name!: string;

  @IsOptional()
  @IsString()
  id?: string;
}
