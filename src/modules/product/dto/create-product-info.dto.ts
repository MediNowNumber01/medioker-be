import { CatCreate, Golongan } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MinLength,
  Validate,
} from "class-validator";
import { MinWordsHTMLConstraint } from "../../../utils/min-html-words-constraint";
import { MinWordsConstraint } from "../../../utils/min-words-constraint";

export class CreateProductInfoDTO {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Matches(/^.{3,}$/, { message: "name should be at least 3 characters long" })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Matches(/^.{3,}$/, {
    message: "nameMIMS should be at least 3 characters long",
  })
  nameMIMS!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(Golongan, {
    message: "golongan must be one of the predefined values",
  })
  readonly golongan!: Golongan;

  @IsString()
  @IsNotEmpty()
  @IsEnum(CatCreate, {
    message: "catCreate must be one of the predefined values",
  })
  readonly catCreate!: CatCreate;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Matches(/^.{3,}$/, {
    message: "nomorEdar should be at least 3 characters long",
  })
  nomorEdar!: string;

  @IsBoolean()
  @IsNotEmpty()
  needsPrescription!: boolean;

  @IsString()
  @IsNotEmpty()
  @Validate(MinWordsHTMLConstraint, [3])
  description!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(3, {
    message: "composition should be at least 3 characters long",
  })
  composition!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Validate(MinWordsConstraint, [3])
  dose!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Validate(MinWordsConstraint, [3])
  sideEffects!: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Validate(MinWordsConstraint, [3])
  indication!: string;

  @IsNotEmpty()
  @IsString({ each: true })
  productCategory!: string[];
}
