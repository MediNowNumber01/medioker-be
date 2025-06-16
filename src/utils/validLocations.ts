import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "validLocation", async: false })
export class ValidLocationConstraint implements ValidatorConstraintInterface {
  validate(loc: any) {
    if (typeof loc !== "string") {
      return false;
    }
    if (!/^[0-9.\-]+$/.test(loc)) {
      return false;
    }
    const split = loc.split(".");
    if (!split[0] && split[0].length) {
      return false;
    }
    if (split.length !== 2) {
      return false;
    }
    if (isNaN(Number(split[0])) || isNaN(Number(split[1]))) {
      return false;
    }
    if (split[1].length < 6) {
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must contain at least 6 characters in the second part.`;
  }
}
