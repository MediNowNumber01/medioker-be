import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  MinLength,
  Validate
} from "class-validator";
import { MinWordsHTMLConstraint } from "../../../utils/min-html-words-constraint";
import { ValidLocationConstraint } from "../../../utils/validLocations";

export class CreatePharmacyDTO {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(3)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @Validate(MinWordsHTMLConstraint, [3])
  description!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  detailLocation!: string;

  @IsNotEmpty()
  @IsString()
  @Validate(ValidLocationConstraint)
  lat!: string;
  
  @IsNotEmpty()
  @IsString()
  @Validate(ValidLocationConstraint)
  lng!: string;

  @IsNotEmpty()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isMain!: boolean;
}
