import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
  MinLength,
} from "class-validator";

export class CreatePharmacyDTO {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @MinLength(3)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @IsString()
  @IsNotEmpty()
  picture!: string;

  @IsBoolean()
  @IsNotEmpty()
  isOpen!: boolean;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  detailLocation!: string;

  @IsLatitude()
  @IsNotEmpty()
  lat!: string;

  @IsLongitude()
  @IsNotEmpty()
  lng!: string;

  @IsBoolean()
  @IsNotEmpty()
  isMain!: boolean;
}
