import { IsEmail, IsNotEmpty } from "class-validator";

export class forgotPasswordDTO {
  @IsNotEmpty()
  @IsEmail()
  readonly email!: string;
}
