import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { env } from "../../config";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { verifyRole } from "../../middleware/role.middleware";
import { fileFilter, uploader } from "../../middleware/uploader.middleware";
import { accountController } from "./account.controller";

@autoInjectable()
export class AccountRouter {
  private readonly router: Router = Router();

  constructor(
    private readonly accountController: accountController,
    private readonly jwtMiddleware: JwtMiddleware,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes = (): void => {
    this.router.get(
      "/",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.accountController.getAllAccount,
    );
    this.router.get(
      "/user",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["USER"]),
      this.accountController.getUser,
    );
    this.router.get(
      "/users",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.accountController.getUsers,
    );

    this.router.get(
      "/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.accountController.getSuperAdmin,
    );
    this.router.patch(
      "/",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      uploader().fields([{ name: "profilePict", maxCount: 1 }]),
      fileFilter,
      verifyRole(["USER"]),
      this.accountController.updateAccount,
    );
    this.router.delete(
      "/profilepict",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["USER"]),
      this.accountController.deleteProfilePict,
    );
    this.router.delete(
      "/:accountId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.accountController.deleteUser,
    );
  };

  public getRouter(): Router {
    return this.router;
  }
}
