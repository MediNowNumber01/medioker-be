import { IsBoolean, IsNotEmpty } from "class-validator";

export class ProductImageDTO {
  @IsNotEmpty()
  @IsBoolean()
  isThumbnail!: boolean;
}
