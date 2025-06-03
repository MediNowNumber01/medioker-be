import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class RegisterDTO {
  @IsNotEmpty()
  @IsString()
  readonly email!: string;

  @IsNotEmpty()
  @IsString()
  readonly fullName!: string;

  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 6,
    minSymbols: 0,
    minLowercase: 0,
    minNumbers: 1,
    minUppercase: 1,
  })
  readonly password!: string;
}
