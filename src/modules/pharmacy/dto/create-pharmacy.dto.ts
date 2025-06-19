import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  max,
  MaxLength,
  maxLength,
  MinLength,
  Validate,
} from "class-validator";
import { MinWordsConstraint } from "../../../utils/min-words-constraint";
import { ValidLatitude } from "../../../utils/ValidLatitude";
import { ValidLongitude } from "../../../utils/ValidLongitude";

export class CreatePharmacyDTO {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(3)
  @MaxLength(20)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  detailLocation!: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @Validate(ValidLatitude)
  @Transform(({ value }) => {
    const parts = value.split(".");
    parts[1] = parts[1]?.slice(0, 7);
    return parts.join(".");
  })
  lat!: string;

  @IsNotEmpty()
  @IsString()
  @Validate(ValidLongitude)
  @Transform(({ value }) => {
    const parts = value.split(".");
    parts[1] = parts[1]?.slice(0, 7);
    return parts.join(".");
  })
  lng!: string;

  @IsNotEmpty()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isMain!: boolean;
}
