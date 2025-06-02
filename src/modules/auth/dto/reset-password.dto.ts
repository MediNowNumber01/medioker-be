import { IsNotEmpty, IsStrongPassword } from "class-validator";

export class ResetPasswordDTO {
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
