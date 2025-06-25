import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsPostalCode,
  IsString,
  IsStrongPassword,
  Validate,
} from "class-validator";
import { ValidLatitude } from "../../../utils/ValidLatitude";
import { ValidLongitude } from "../../../utils/ValidLongitude";

export class AddAddressDTO {
  @IsNotEmpty()
  @IsString()
  label?: string;

  @IsNotEmpty()
  @IsString()
  fullAddress!: string;

  @IsNotEmpty()
  @IsPostalCode("ID")
  postalCode!: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @Validate(ValidLatitude)
  @Transform(({ value }) => {
    const parts = value.split(".");
    parts[1] = parts[1]?.slice(0, 7);
    return parts.join(".");
  })
  latitude!: string;

  @IsNotEmpty()
  @IsString()
  @Validate(ValidLongitude)
  @Transform(({ value }) => {
    const parts = value.split(".");
    parts[1] = parts[1]?.slice(0, 7);
    return parts.join(".");
  })
  longitude!: string;

  @IsBoolean()
  @IsNotEmpty()
  isPrimary!: boolean;
}
