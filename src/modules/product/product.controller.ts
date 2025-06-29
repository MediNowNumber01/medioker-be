import { plainToInstance } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { ApiError } from "../../utils/api-error";
import { CreateProductInfoDTO } from "./dto/create-product-info.dto";
import { GetProductsDTO } from "./dto/get-products.dto";
import { ProductImageDTO } from "./dto/product-image.dto";
import { UpdateProductInfoDTO } from "./dto/update-product-info.dto";
import { verifyExistingNameDTO } from "./dto/verify-name-dto";
import { ProductService } from "./product.service";
import { CreateUnitProductDTO } from "./dto/create-unit-product.dto";
import { UpdateUnitProductDTO } from "./dto/update-unit-product.dto";

@injectable()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  public publishProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ApiError("Product ID is required", 400);
      }
      const result = await this.productService.publishProduct(id);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public deleteProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ApiError("Product ID is required", 400);
      }
      const result = await this.productService.deleteProduct(id);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public getProducts = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      let userId = req.user?.id;
      const query = plainToInstance(GetProductsDTO, req.query);
      const result = await this.productService.getProducts(query);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public getProductDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const slug = req.params.slug;
      if (!slug) {
        throw new ApiError("Product ID is required", 400);
      }
      const result = await this.productService.getProductDetails(slug);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public getAdminProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      let userId = req.user?.id;
      const query = plainToInstance(GetProductsDTO, req.query);
      const result = await this.productService.getAdminProducts(query);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public getDashboardProducts = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await this.productService.getDashboardProducts();
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public createProductInfo = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const body = req.body as CreateProductInfoDTO;
      const result = await this.productService.createProductInfo(body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public verifyExistingName = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const body = req.body as verifyExistingNameDTO;
      const result = await this.productService.verifyExistingName(body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public updateProductInfo = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const body = req.body as UpdateProductInfoDTO;
      const id = req.params.id;
      if (!id) {
        throw new ApiError("Product ID is required", 400);
      }
      const result = await this.productService.updateProductInfo(id, body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public uploadProductImage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const productImage = files.image?.[0];
      const productId = req.params.id;
      if (!productImage) {
        throw new ApiError("Product image is required", 400);
      }
      if (!productId) {
        throw new ApiError("Product ID is required", 400);
      }
      const body = req.body as ProductImageDTO;
      const result = await this.productService.uploadProductImage(
        productId,
        productImage,
        body,
      );
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public updateToThumbnail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const imageId = req.params.imageId;
      if (!imageId) {
        throw new ApiError("Product ID and Image ID are required", 400);
      }
      const result = await this.productService.updateToThumbnail(imageId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public deleteProductImage = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const imageId = req.params.imageId;
      if (!imageId) {
        throw new ApiError("Image ID is required", 400);
      }
      const result = await this.productService.deleteProductImage(imageId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public createUnitProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const productId = req.params.id;
      const body = req.body as CreateUnitProductDTO;
      const result = await this.productService.createUnitProduct(
        productId,
        body,
      );
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public updateUnitProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const body = req.body as UpdateUnitProductDTO;
      const id = req.params.id;
      if (!id) {
        throw new ApiError("Product ID is required", 400);
      }
      const result = await this.productService.updateUnitProduct(id, body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public deleteUnitProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ApiError("Product ID is required", 400);
      }
      const result = await this.productService.deleteUnitProduct(id);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
}
