import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty } from "class-validator";

export class ProductImageDTO {
  @IsNotEmpty()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  // @IsBoolean()
  isThumbnail!: boolean;
}
