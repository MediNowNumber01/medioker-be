import { IsEnum, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export enum AdminRole {
  DOCTOR = "DOCTOR",
  PHARMACIST = "PHARMACIST",
  CASHIER = "CASHIER",
}

export class UpdateAdminDTO {
  @IsNotEmpty()
  @IsString()
  readonly email?: string;

  @IsNotEmpty()
  @IsString()
  readonly fullName?: string;

  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 6,
    minSymbols: 0,
    minLowercase: 0,
    minNumbers: 1,
    minUppercase: 1,
  })
  readonly password?: string;

  @IsNotEmpty()
  @IsEnum(AdminRole, {
    message: "Role must be either DOCTOR, PHARMACIST, or CASHIER",
  })
  readonly adminRole?: AdminRole;
}