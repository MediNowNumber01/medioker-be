import { IsNotEmpty, IsString } from "class-validator";

export class assignAdminPharmacyDTO {
  @IsNotEmpty()
  @IsString({ each: true })
  adminId!: string[];

  @IsNotEmpty()
  @IsString()
  pharmacyId!: string;
}
