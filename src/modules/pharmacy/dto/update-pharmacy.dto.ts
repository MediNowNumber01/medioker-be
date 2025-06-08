import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  Validate
} from "class-validator";
import { MinWordsHTMLConstraint } from "../../../utils/min-html-words-constraint";
import { ValidLocationConstraint } from "../../../utils/validLocations";

export class UpdatePharmacyDTO {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @Validate(MinWordsHTMLConstraint, [3])
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  detailLocation?: string;

  @IsOptional()
  @Validate(ValidLocationConstraint)
  lat?: string;

  @IsOptional()
  @Validate(ValidLocationConstraint)
  lng?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isMain?: boolean;
}
