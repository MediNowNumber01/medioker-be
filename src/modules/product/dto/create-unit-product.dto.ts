import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
  Validate,
} from "class-validator";

export class CreateUnitProductDTO {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(3)
  name!: string;

  @IsBoolean()
  @IsNotEmpty()
  isMain!: boolean;

  @IsNumber()
  @IsNotEmpty()
  @Validate((value: number) => 0 < value, {
    message: "weight must be greater than zero",
  })
  readonly weight!: number;

  @IsNumber()
  @IsNotEmpty()
  @Validate((value: number) => 0 <= value, {
    message: "price must be greater than equal zero",
  })
  readonly price!: number;

  @IsNumber()
  @IsNotEmpty()
  @Validate((value: number) => 0 < value, {
    message: "ratioToMain must be greater than zero",
  })
  ratioToMain!: number;
}
