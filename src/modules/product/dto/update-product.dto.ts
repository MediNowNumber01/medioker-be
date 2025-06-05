import { IsOptional, IsString, Matches, Validate } from "class-validator";
import { Transform } from "class-transformer";
import { MinWordsConstraint } from "../../../utils/min-words-constraint";

export class UpdateProductDTO {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @Matches(/^.{3,}$/, { message: "name must be at least 3 characters long" })
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @Validate(MinWordsConstraint, [3])
  description?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @Matches(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
  color?: string;
}
