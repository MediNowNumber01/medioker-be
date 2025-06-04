import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { ProductController } from "./product.controller";

@autoInjectable()
export class ProductRouter {
  private readonly router: Router = Router();

  constructor(
    private readonly jwtMiddleware: JwtMiddleware,
    private readonly productController: ProductController,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes = (): void => {};

  getRouter(): Router {
    return this.router;
  }
}
