import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto";

export class GetPharmaciesDTO extends PaginationQueryParams {
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  isOpen?: string;
}
