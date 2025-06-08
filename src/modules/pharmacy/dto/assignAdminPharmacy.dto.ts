import { IsNotEmpty, IsString } from "class-validator";

export class assignAdminPharmacyDTO {
  @IsNotEmpty()
  @IsString()
  adminId!: string;

  @IsNotEmpty()
  @IsString()
  pharmacyId!: string;
}
