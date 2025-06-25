import { IsNotEmpty, IsString } from "class-validator";

export class assignEmployeePharmacyDTO {
  @IsNotEmpty()
  @IsString({ each: true })
  adminId!: string[];

  @IsNotEmpty()
  @IsString()
  pharmacyId!: string;
}
