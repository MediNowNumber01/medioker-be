import jwt, { SignOptions } from "jsonwebtoken";
import { ApiError } from "../../utils/api-error";

export class TokenService {
  generateToken = (
    payload: object,
    secretKey: string,
    options?: SignOptions,
  ): string => {
    return jwt.sign(payload, secretKey, options);
  };

  verifyToken = (token: string, secretKey: string): any => {
    try {
      return jwt.verify(token, secretKey);
    } catch (error: any) {
      console.error("JWT verification error:", error.message); 
      throw new ApiError("Invalid or expired token", 400);
    }
  };
}
