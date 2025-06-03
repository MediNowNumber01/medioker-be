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

  verifyToken = async (token: string, secretKey: string): Promise<any> => {
    try {
      return await new Promise((resolve, reject) => {
        jwt.verify(token, secretKey, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        });
      });
    } catch (error) {
      throw new ApiError(`Invalid or expired token`, 400);
    }
  };
}
