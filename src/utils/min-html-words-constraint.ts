import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { ApiError } from "./api-error";

@ValidatorConstraint({ name: "MinWordsHTML", async: false })
export class MinWordsHTMLConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    const minWords = args.constraints[0];
    if (typeof minWords !== "number" || minWords <= 0) {
      throw new ApiError("Minimum words must be a positive number.", 400);
    }
    if (typeof text !== "string") {
      return false;
    }

    const wordCount = text
      .replace(/<[^>]*>/g, "")
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    return wordCount >= minWords;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must contain at least ${args.constraints[0]} words.`;
  }
}
