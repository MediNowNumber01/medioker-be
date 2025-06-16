import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  MinLength,
  Validate,
} from "class-validator";
import { MinWordsHTMLConstraint } from "../../../utils/min-html-words-constraint";
import { ValidLocationConstraint } from "../../../utils/validLocations";
import { MinWordsConstraint } from "../../../utils/min-words-constraint";

export class CreatePharmacyDTO {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(3)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @Validate(MinWordsConstraint, [3])
  description!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  detailLocation!: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @Validate(ValidLocationConstraint)
  @Transform(({ value }) => {
    const parts = value.split(".");
    parts[1] = parts[1]?.slice(0, 7);
    return parts.join(".");
  })
  lat!: string;

  @IsNotEmpty()
  @IsString()
  @Validate(ValidLocationConstraint)
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
