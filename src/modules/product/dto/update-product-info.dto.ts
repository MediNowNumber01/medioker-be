import { Acquisition, Golongan } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  Validate,
} from "class-validator";
import { MinWordsHTMLConstraint } from "../../../utils/min-html-words-constraint";
import { MinWordsConstraint } from "../../../utils/min-words-constraint";

export class UpdateProductInfoDTO {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Matches(/^.{3,}$/, { message: "name should be at least 3 characters long" })
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Matches(/^.{3,}$/, {
    message: "nameMIMS should be at least 3 characters long",
  })
  nameMIMS?: string;

  @IsOptional()
  @IsString()
  @IsEnum(Golongan, {
    message: "golongan must be one of the predefined values",
  })
  readonly golongan?: Golongan;

  @IsOptional()
  @IsString()
  @IsEnum(Acquisition, {
    message: "acquisition must be one of the predefined values",
  })
  readonly acquisition?: Acquisition;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Matches(/^.{3,}$/, {
    message: "nomorEdar should be at least 3 characters long",
  })
  nomorEdar?: string;

  @IsOptional()
  @IsBoolean()
  needsPrescription?: boolean;

  @IsOptional()
  @IsString()
  @Validate(MinWordsHTMLConstraint, [3])
  description?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(3, {
    message: "composition should be at least 3 characters long",
  })
  composition?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Validate(MinWordsConstraint, [3])
  dose?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Validate(MinWordsConstraint, [3])
  sideEffects?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Validate(MinWordsConstraint, [3])
  indication?: string;

  @IsOptional()
  @IsString({ each: true })
  productCategory?: string[];
}
