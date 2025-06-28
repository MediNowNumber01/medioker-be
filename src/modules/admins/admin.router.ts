import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { env } from "../../config";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { verifyRole } from "../../middleware/role.middleware";
import { AdminController } from "./admin.controller";
import { fileFilter, uploader } from "../../middleware/uploader.middleware";
import { CreateAdminDTO } from "./dto/create-admin.dto";
import { validateBody } from "../../middleware/validation.middleware";

@autoInjectable()
export class AdminRouter {
  private readonly router: Router = Router();

  constructor(
    private readonly jwtMiddleware: JwtMiddleware,
    private readonly adminController: AdminController,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes = (): void => {
    this.router.get(
      "/",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.adminController.getAdmins,
    );
    this.router.get(
      "/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.adminController.getAdminDetail,
    );
    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      uploader().fields([{ name: "profilePict", maxCount: 1 }]),
      fileFilter,
      verifyRole(["SUPER_ADMIN"]),
      validateBody(CreateAdminDTO),
      this.adminController.createAdmin,
    );
    this.router.delete(
      "/:accountId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.adminController.deleteAdmin,
    );
    this.router.patch(
      "/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      uploader().fields([{ name: "profilePict", maxCount: 1 }]),
      fileFilter,
      verifyRole(["SUPER_ADMIN"]),
      this.adminController.updateAdmin,
    );
  };

  public getRouter(): Router {
    return this.router;
  }
}
