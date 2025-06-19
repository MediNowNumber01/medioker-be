import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "validLatitude", async: false })
export class ValidLatitude implements ValidatorConstraintInterface {
  validate(lat: any) {
    if (typeof lat !== "string") {
      return false;
    }
    if (!/^[0-9.\-]+$/.test(lat)) {
      return false;
    }
    if (typeof lat !== "string") return false;
    const parts = lat.split(".");
    return (
      parts.length === 2 &&
      parts[0].length > 0 &&
      parts[1].length >= 7 &&
      !isNaN(Number(parts[0])) &&
      !isNaN(Number(parts[1])) &&
      Number(parts[0]) >= -90 &&
      Number(parts[0]) <= 90
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must contain at least 7 characters in the second part.`;
  }
}
