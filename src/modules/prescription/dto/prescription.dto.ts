import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum PrescriptionOrderType {
  DELIVERY = "DELIVERY",
  PICKUP = "PICKUP",
}

export class CreatePrescriptionOrderDTO {
  @IsNotEmpty()
  @IsEnum(PrescriptionOrderType)
  readonly orderType!: PrescriptionOrderType;

  @IsNotEmpty()
  @IsString()
  readonly pharmacyId!: string;

  @IsOptional()
  @IsString()
  readonly note?: string;

  @IsOptional()
  @IsString()
  readonly userAddressId?: string;
}