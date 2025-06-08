import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class UpdatePharmacyDTO {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(10)
  detailLocation?: string;

  @IsOptional()
  @IsLatitude()
  lat?: string;

  @IsOptional()
  @IsLongitude()
  lng?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
