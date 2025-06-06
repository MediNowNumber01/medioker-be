import { IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto";
import { Transform } from "class-transformer";

export class GetCategoriesDTO extends PaginationQueryParams {
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  search?: string;
}
