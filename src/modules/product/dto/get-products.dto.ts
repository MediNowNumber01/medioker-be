import { IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto";
import { Transform } from "class-transformer";

export class GetProductsDTO extends PaginationQueryParams {
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map((v: string) => v.trim()) : [value.trim()],
  )
  @IsString({ each: true })
  categoryId?: string[];

  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  pharmacyId?: string;
}
