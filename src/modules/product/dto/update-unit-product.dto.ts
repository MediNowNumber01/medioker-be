import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
  IsOptional,
  Validate,
} from "class-validator";

export class UpdateUnitProductDTO {
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @IsOptional()
  @IsNumber()
  @Validate((value: number) => 0 < value, {
    message: "weight must be greater than zero",
  })
  readonly weight?: number;

  @IsOptional()
  @IsNumber()
  @Validate((value: number) => 0 <= value, {
    message: "price must be greater than equal zero",
  })
  readonly price?: number;

  @IsOptional()
  @IsNumber()
  @Validate((value: number) => 0 < value, {
    message: "ratioToMain must be greater than zero",
  })
  ratioToMain?: number;
}
