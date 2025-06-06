import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from "class-validator";

export class CreateUnitProductDTO {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  @MinLength(3)
  name!: string;

  @IsBoolean()
  @IsNotEmpty()
  isMain!: boolean;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly weight!: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly price!: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  readonly ratioToMain!: number;
}
