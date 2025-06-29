import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { ProductController } from "./product.controller";
import { env } from "../../config";
import { verifyRole } from "../../middleware/role.middleware";
import { StrictValidateBody } from "../../middleware/validation.middleware";
import { CreateProductInfoDTO } from "./dto/create-product-info.dto";
import { verifyExistingNameDTO } from "./dto/verify-name-dto";
import { UpdateProductInfoDTO } from "./dto/update-product-info.dto";
import { fileFilter, uploader } from "../../middleware/uploader.middleware";
import { CreateUnitProductDTO } from "./dto/create-unit-product.dto";
import { ProductImageDTO } from "./dto/product-image.dto";

@autoInjectable()
export class ProductRouter {
  private readonly router: Router = Router();

  constructor(
    private readonly jwtMiddleware: JwtMiddleware,
    private readonly productController: ProductController,
  ) {
    this.initializeRoutes();

    this.router.get("/", this.productController.getProducts);
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
      StrictValidateBody(CreateProductInfoDTO),
      this.productController.createProductInfo,
    );
    this.router.post(
      "/verify-name",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      StrictValidateBody(verifyExistingNameDTO),
      this.productController.verifyExistingName,
    );
    this.router.post(
      "/image/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      uploader().fields([{ name: "image", maxCount: 1 }]),
      StrictValidateBody(ProductImageDTO),
      fileFilter,
      this.productController.uploadProductImage,
    );

    this.router.post(
      "/unit/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      StrictValidateBody(CreateUnitProductDTO),
      this.productController.createUnitProduct,
    );
    this.router.get(
      "/dashboard",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.getDashboardProducts,
    );
    this.router.get(
      "/admin",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.getAdminProduct,
    );

    this.router.get("/:slug", this.productController.getProductDetails);
    this.router.patch(
      "/unit/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.updateUnitProduct,
    );
    this.router.patch(
      "/thumbnail/:imageId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.updateToThumbnail,
    );
    this.router.patch(
      "/productsinfo/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      StrictValidateBody(UpdateProductInfoDTO),
      this.productController.updateProductInfo,
    );
    // ================delete================

    this.router.delete(
      "/image/:imageId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.productController.deleteProductImage,
    );
    this.router.delete(
      "/unit/:id",
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
