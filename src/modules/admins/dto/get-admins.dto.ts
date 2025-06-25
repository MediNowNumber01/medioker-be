import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/dto/pagination.dto";
import { AdminRole } from "@prisma/client";

export class GetAdminsDTO extends PaginationQueryParams {
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @IsOptional()
  @Transform(({ value }) =>
    value === "true" ? "true" : value === "false" ? "false" : undefined,
  )
  @IsString()
  status?: "true" | "false";

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  notOnPharmacy?: string;
}
