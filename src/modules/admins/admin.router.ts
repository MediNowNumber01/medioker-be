import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { env } from "../../config";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { verifyRole } from "../../middleware/role.middleware";
import { AdminController } from "./admin.controller";

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
  };

  public getRouter(): Router {
    return this.router;
  }
}
