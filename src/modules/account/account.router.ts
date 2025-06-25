import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { accountController } from "./account.controller";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { env } from "../../config";
import { verifyRole } from "../../middleware/role.middleware";
import { fileFilter, uploader } from "../../middleware/uploader.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { CreateAdminDTO } from "./dto/create-admin.dto";

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
      this.accountController.getAllUsers,
    );
    this.router.get(
      "/admins",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.accountController.getAdmin,
    );
    this.router.post(
      "/create-admin",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      uploader().fields([{ name: "profilePict", maxCount: 1 }]),
      fileFilter,
      verifyRole(["SUPER_ADMIN"]),
      validateBody(CreateAdminDTO),
      this.accountController.createAdmin,
    );
    this.router.delete(
      "/delete-admin/:accountId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.accountController.deleteAdmin,
    );
    this.router.delete(
      "/delete-user/:accountId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.accountController.deleteUser,
    );
    this.router.delete(
      "/delete-pic",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["USER"]),
      this.accountController.deleteProfilePict,
    );
    this.router.patch(
      "/update-account",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      uploader().fields([{ name: "profilePict", maxCount: 1 }]),
      fileFilter,
      verifyRole(["USER"]),
      this.accountController.updateAccount,
    );
  };

  public getRouter(): Router {
    return this.router;
  }
}
