import { Transform } from "class-transformer";
import {
  IsOptional,
  IsString,
  Matches,
  MinLength,
  Validate,
} from "class-validator";
import { MinWordsConstraint } from "../../../utils/min-words-constraint";

export class UpdateCategoryDTO {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(3, { message: "name must be at least 3 characters long" })
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Validate(MinWordsConstraint, [3])
  description?: string;
}
