import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  Validate,
} from "class-validator";
import { MinWordsHTMLConstraint } from "../../../utils/min-html-words-constraint";
import { ValidLatitude } from "../../../utils/ValidLatitude";
import { ValidLongitude } from "../../../utils/ValidLongitude";

export class UpdatePharmacyDTO {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  detailLocation?: string;

  @IsOptional()
  @Validate(ValidLatitude)
  @Transform(({ value }) => {
    const parts = value.split(".");
    parts[1] = parts[1]?.slice(0, 7);
    return parts.join(".");
  })
  lat?: string;

  @IsOptional()
  @Validate(ValidLongitude)
  @Transform(({ value }) => {
    const parts = value.split(".");
    parts[1] = parts[1]?.slice(0, 7);
    return parts.join(".");
  })
  lng?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isMain?: boolean;
}
