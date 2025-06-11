import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { AuthService } from "./auth.service";
import { LoginDTO } from "./dto/login.dto";
import { RegisterDTO } from "./dto/register.dto";
import { ApiError } from "../../utils/api-error";

@injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
      const profilePict = files.image?.[0];
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

  //   googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const authHeader = req.headers.authorization;
  //     if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //       throw new Error('Token tidak valid');
  //     }
  //     const token = authHeader.replace('Bearer ', '');

  //     const result = await this.authService.googleLogin(token);
  //     res.status(200).json(result);
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  // Controller Backend
  googleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body; // Ambil token dari body
      if (!token) throw new Error("Token tidak valid");

      const result = await this.authService.googleLogin(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
