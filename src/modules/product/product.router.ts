import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { ProductController } from "./product.controller";
import { env } from "../../config";
import { verifyRole } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { CreateProductInfoDTO } from "./dto/create-product-info.dto";
import { verifyExistingNameDTO } from "./dto/verify-name-dto";
import { UpdateProductInfoDTO } from "./dto/update-product-info.dto";
import { fileFilter, uploader } from "../../middleware/uploader.middleware";
import { CreateUnitProductDTO } from "./dto/create-unit-product.dto";

@autoInjectable()
export class ProductRouter {
  private readonly router: Router = Router();

  constructor(
    private readonly jwtMiddleware: JwtMiddleware,
    private readonly productController: ProductController,
  ) {
    this.initializeRoutes();

    // ================create================

    this.router.post(
      "/publish/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.publishProduct,
    );
    this.router.post(
      "/productsinfo",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      validateBody(CreateProductInfoDTO),
      this.productController.createProductInfo,
    );
    this.router.post(
      "/product-image/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      uploader().fields([{ name: "image", maxCount: 1 }]),
      fileFilter,
      this.productController.uploadProductImage,
    );
    this.router.post(
      "/product-unit/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      validateBody(CreateUnitProductDTO),
      this.productController.createUnitProduct,
    );
    // ================read================
    this.router.get("/", this.productController.getProducts);
    this.router.get(
      "/verify-name",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      validateBody(verifyExistingNameDTO),
      this.productController.verifyExistingName,
    );
    this.router.get("/:slug", this.productController.getProductDetails);
    // ================update================
    this.router.patch(
      "/product-unit/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.updateUnitProduct,
    );
    this.router.patch(
      "/updateToThumbnail/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.updateToThumbnail,
    );
    this.router.patch(
      "/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      validateBody(UpdateProductInfoDTO),
      this.productController.updateProductInfo,
    );
    // ================delete================

    this.router.delete(
      "/product-image/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.deleteProductImage,
    );
    this.router.delete(
      "/product-unit/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.deleteUnitProduct,
    );
    this.router.delete(
      "/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.deleteProduct,
    );
  }

  private initializeRoutes = (): void => {};

  getRouter(): Router {
    return this.router;
  }
}
