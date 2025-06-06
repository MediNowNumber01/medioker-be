import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
  IsOptional,
} from "class-validator";

export class UpdateUnitProductDTO {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly weight?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly price?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  readonly ratioToMain?: number;
}
