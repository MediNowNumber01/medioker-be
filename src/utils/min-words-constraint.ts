import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { ApiError } from "./api-error";

@ValidatorConstraint({ name: "MinWords", async: false })
export class MinWordsConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    const minWords = args.constraints[0];
    if (typeof minWords !== "number" || minWords <= 0) {
      throw new ApiError("Minimum words must be a positive number.", 400);
    }
    return (
      typeof text === "string" && text.trim().split(/\s+/).length >= minWords
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must contain at least ${args.constraints[0]} words.`;
  }
}
