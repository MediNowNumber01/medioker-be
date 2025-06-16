import {
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  minLength,
  Validate,
} from "class-validator";
import { Transform } from "class-transformer";
import { MinWordsConstraint } from "../../../utils/min-words-constraint";

export class CreateCategoryDTO {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(3, { message: "name must be at least 3 characters long" })
  name!: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Validate(MinWordsConstraint, [3])
  description!: string;
}
