import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto";
import { Transform } from "class-transformer";
import { Acquisition, Golongan } from "@prisma/client";

export class GetProductsDTO extends PaginationQueryParams {
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v: string) => v?.trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  })
  @IsString({ each: true })
  categoryId?: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsEnum(Acquisition)
  acquisition?: Acquisition;

  @IsOptional()
  @IsEnum(Golongan)
  golongan?: Golongan;

  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  pharmacyId?: string;
}
