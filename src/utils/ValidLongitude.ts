import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "validLongitude", async: false })
export class ValidLongitude implements ValidatorConstraintInterface {
  validate(lng: any) {
    if (typeof lng !== "string") {
      return false;
    }
    if (!/^[0-9.\-]+$/.test(lng)) {
      return false;
    }
    if (typeof lng !== "string") return false;
    const parts = lng.split(".");
    return (
      parts.length === 2 &&
      parts[0].length > 0 &&
      parts[1].length >= 7 &&
      !isNaN(Number(parts[0])) &&
      !isNaN(Number(parts[1])) &&
      Number(parts[0]) >= -180 &&
      Number(parts[0]) <= 180
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must contain at least 7 characters in the second part.`;
  }
}
