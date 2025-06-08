import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { validateBody } from "../../middleware/validation.middleware";
import { AuthController } from "./auth.controller";
import { LoginDTO } from "./dto/login.dto";
import { RegisterDTO } from "./dto/register.dto";
import { fileFilter, uploader } from "../../middleware/uploader.middleware";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { forgotPasswordDTO } from "./dto/forgot-password.dto";
import { env } from "../../config";
import { ResetPasswordDTO } from "./dto/reset-password.dto";

@autoInjectable()
export class AuthRouter {
  private readonly router: Router = Router();

  constructor(
    private readonly authController: AuthController,
    private readonly jwtMiddleware: JwtMiddleware,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes = (): void => {
    this.router.post(
      "/login",
      validateBody(LoginDTO),
      this.authController.login,
    );
    this.router.post(
      "/register",
      uploader().fields([{ name: "image", maxCount: 1 }]),
      fileFilter,
      validateBody(RegisterDTO),

      this.authController.register,
    );
    this.router.post("/verify/:token", this.authController.verify);
    this.router.post(
      "/forgot-password",
      validateBody(forgotPasswordDTO),
      this.authController.forgotPassword,
    );

    this.router.patch(
      "/reset-password",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET_FORGOT_PASSWORD!),
      validateBody(ResetPasswordDTO),
      this.authController.resetPassword,
    );
  };

  getRouter(): Router {
    return this.router;
  }
}
