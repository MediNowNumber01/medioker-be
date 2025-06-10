import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class verifyExistingNameDTO {
  @IsNotEmpty()
  @IsString()
  readonly name!: string;

  @IsOptional()
  @IsString()
  readonly id?: string;
}
