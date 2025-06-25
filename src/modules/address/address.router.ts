import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { env } from "../../config";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { verifyRole } from "../../middleware/role.middleware";
import { AddressController } from "./address.controller";

@autoInjectable()
export class AddressRouter {
  private readonly router: Router = Router();

  constructor(
    private readonly jwtMiddleware: JwtMiddleware,
    private readonly addressController: AddressController,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes = (): void => {
    this.router.get(
      "/",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["USER"]),
      this.addressController.getUserAddress,
    );
    this.router.patch(
      "/set-primary/:addressId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["USER"]),
      this.addressController.setPrimary,
    );
    this.router.post(
      "/add-address/",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["USER"]),
      this.addressController.addAddress,
    );
  };

  public getRouter(): Router {
    return this.router;
  }
}
