import { IsNotEmpty, IsString } from "class-validator";

export class verifyExistingNameDTO {
  @IsNotEmpty()
  @IsString()
  readonly name!: string;
}
