import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { AuthService } from "./auth.service";
import { LoginDTO } from "./dto/login.dto";
import { RegisterDTO } from "./dto/register.dto";
import { ApiError } from "../../utils/api-error";
import { TokenService } from "./token.service";
import { env } from "../../config";

@injectable()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as LoginDTO;
      const result = await this.authService.login(body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const profilePict = files.profilePict?.[0];
      const body = req.body as RegisterDTO;

      const result = await this.authService.register(body, profilePict);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;

      const result = await this.authService.verify(token);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.user?.id;

      if (!accountId) {
        throw new ApiError("Account ID not found in token", 401);
      }

      const result = await this.authService.resetPassword(req.body, accountId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.forgotPassword(req.body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body; // Ambil token dari body
      if (!token) throw new Error("Token tidak valid");

      const result = await this.authService.googleLogin(token);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  verifyResetToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { token } = req.params;
       if (!token || token.split(".").length !== 3) {
      return res.status(400).json({ message: "Malformed or invalid token" });
    }
      this.tokenService.verifyToken(token, env().JWT_SECRET_FORGOT_PASSWORD!);

      res.status(200).send({ message: "Token is valid" });
    } catch (error) {
      next(error);
    }
  };

  resendVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.user?.id;

      if (!accountId) {
        throw new ApiError("Account ID not found in token", 400);
      }
      const result = this.authService.resendVerification(accountId);

      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  verifyAccountToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { token } = req.params;
      this.tokenService.verifyToken(token, env().JWT_SECRET_VERIFY!);

      res.status(200).send({ message: "Token is valid" });
    } catch (error) {
      next(error);
    }
  };
}
