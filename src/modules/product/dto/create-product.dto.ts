import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches, Validate } from "class-validator";

export class CreateProductDTO {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Matches(/^.{3,}$/, { message: "name must be at least 3 characters long" })
  name!: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  description!: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @Matches(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/)
  color!: string;
}
