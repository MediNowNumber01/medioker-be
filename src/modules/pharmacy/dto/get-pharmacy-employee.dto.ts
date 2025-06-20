import { AdminRole } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto";

export class GetPharmacyEmployeesDTO extends PaginationQueryParams {
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  @IsString()
  role?: string;
}
