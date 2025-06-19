import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";

export const verifyAccount = (roles: boolean[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const isVerified = req.user?.isVerified;

    if (!isVerified || !roles.includes(isVerified)) {
      throw new ApiError("Forbidden", 403);
    }

    next();
  };
};
