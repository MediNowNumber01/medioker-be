import { CatCreate, Golongan, Prisma, Product } from "@prisma/client";
import { injectable } from "tsyringe";
import { ApiError } from "../../utils/api-error";
import { generateSlug } from "../../utils/generate-slug";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PaginationService } from "../pagination/pagination.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductInfoDTO } from "./dto/create-product-info.dto";
import { CreateUnitProductDTO } from "./dto/create-unit-product.dto";
import { ProductImageDTO } from "./dto/product-image.dto";
import { UpdateProductInfoDTO } from "./dto/update-product-info.dto";
import { verifyExistingNameDTO } from "./dto/verify-name-dto";
import { GetProductsDTO } from "./dto/get-products.dto";
import { UpdateUnitProductDTO } from "./dto/update-unit-product.dto";

@injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly fileService: CloudinaryService,
  ) {}

  private async validateProductId(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        ProductImage: true,
        UnitProduct: true,
      },
    });
    if (!product) {
      throw new ApiError("Product not found", 404);
    }
    if (product.deletedAt) {
      throw new ApiError("Product has been deleted", 410);
    }
    return product;
  }

  private async validateProductName(name: string, id?: string) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        id: id ? { not: id } : undefined,
      },
    });
    if (existingProduct) {
      if (existingProduct.deletedAt) {
        throw new ApiError(
          "Product with this name already exists but is deleted",
          422,
        );
      }
      throw new ApiError("Product with this name already exists", 400);
    }
    return true;
  }

  private async validateCategory(id: string[]) {
    const existingCategories = await this.prisma.category.findMany({
      where: {
        id: { in: id },
      },
    });
    if (existingCategories.length === 0) {
      throw new ApiError("One or more categories do not exist", 400);
    }
    return true;
  }

  private async validateSlug(slug: string, id?: string) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        slug,
        id: id ? { not: id } : undefined,
      },
    });
    if (existingProduct) {
      throw new ApiError("Product with this slug already exists", 400);
    }
    return true;
  }

  private existingThumbnailCheck = async (id: string) => {
    const existingThumbnail = await this.prisma.productImage.findFirst({
      where: { productId: id, isThumbnail: true },
    });
    return existingThumbnail;
  };

  private changeThumbnail = async (idProduct: string, idImage: string) => {
    const existingThumbnail = await this.existingThumbnailCheck(idProduct);
    const existingImage = await this.prisma.productImage.findUnique({
      where: { id: idImage, productId: idProduct },
    });
    if (!existingImage) throw new ApiError("Image not found", 404);
    const result = await this.prisma.$transaction(async (tx) => {
      if (existingThumbnail) {
        await tx.productImage.updateMany({
          where: { productId: idProduct, isThumbnail: true },
          data: { isThumbnail: false },
        });
      }
      const newThumbnail = await tx.productImage.update({
        where: { id: idImage },
        data: { isThumbnail: true },
      });
      return newThumbnail;
    });
    return result;
  };

  private async excitingUnitProductCheck(id: string) {
    const existingUnitProduct = await this.prisma.unitProduct.findFirst({
      where: { productId: id },
      include: { Product: true },
    });
    return existingUnitProduct;
  }

  private async excitingMainUnitProductCheck(id: string) {
    const existingMainUnitProduct = await this.prisma.unitProduct.findFirst({
      where: { productId: id, isMain: true },
    });
    return existingMainUnitProduct;
  }

  private async changeMainUnitProduct(id: string, unitId: string) {
    const existingMainUnitProduct = await this.excitingMainUnitProductCheck(id);
    if (existingMainUnitProduct) {
      await this.prisma.unitProduct.updateMany({
        where: { productId: id, isMain: true },
        data: { isMain: false },
      });
    }
    const updatedUnit = await this.prisma.unitProduct.update({
      where: { id: unitId },
      data: { isMain: true },
    });
    return updatedUnit;
  }

  // core service methods
  public publishProduct = async (id: string) => {
    const existingProduct = await this.validateProductId(id);
    if (existingProduct.deletedAt)
      throw new ApiError("Cannot publish a deleted product", 410);
    if (existingProduct.published)
      throw new ApiError("Product is already published", 400);
    if (existingProduct.UnitProduct.length === 0)
      throw new ApiError("Product must have at least one unit to publish", 400);
    if (existingProduct.ProductImage.length === 0)
      throw new ApiError(
        "Product must have at least one image to publish",
        400,
      );
    const data = await this.prisma.$transaction(async (tx) => {
      const existingPharmacy = await tx.pharmacy.findMany({
        select: { id: true },
      });
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { published: true },
      });
      if (existingPharmacy.length > 0) {
        await tx.stock.createMany({
          data: existingPharmacy.map((pharmacy) => ({
            productId: id,
            pharmacyId: pharmacy.id,
            quantity: 0, // Initialize with zero quantity
          })),
        });
      }
      return updatedProduct;
    });
    return {
      message: "Product published successfully",
      data,
    };
  };

  public deleteProduct = async (id: string) => {
    const existingProduct = await this.validateProductId(id);
    if (existingProduct.deletedAt)
      throw new ApiError("Product has already been deleted", 410);
    this.prisma.$transaction(async (tx) => {
      if (!existingProduct.published) {
        await Promise.all([
          tx.unitProduct.deleteMany({ where: { productId: id } }),
          tx.productCategory.deleteMany({ where: { productId: id } }),
          tx.productImage.deleteMany({ where: { productId: id } }),
        ]);
        await tx.product.delete({ where: { id } });
      } else {
        await tx.product.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        await tx.stock.updateMany({
          where: { productId: id },
          data: { deletedAt: new Date() },
        });
        await tx.cart.deleteMany({
          where: { stock: { productId: id } },
        });
      }
    });
    return {
      message: "Product deleted successfully",
    };
  };

  public getProducts = async (query: GetProductsDTO) => {
    const { search, categoryId, pharmacyId, ...pagination } = query;
    const where: any = {
      deletedAt: null,
      published: true,
    };
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }
    if (categoryId && categoryId.length > 0) {
      await this.validateCategory(categoryId);
      where.ProductCategory = {
        some: {
          categoryId: { in: categoryId },
        },
      };
    }
    if (pharmacyId) {
      where.Stock = {
        some: {
          pharmacyId,
        },
      };
    } else {
      const mainPharmacy = await this.prisma.pharmacy.findFirst({
        where: { isMain: true },
        select: { id: true },
      });
      if (mainPharmacy) {
        where.Stock = {
          some: {
            pharmacyId: mainPharmacy.id,
          },
        };
      }
    }

    let paginationArgs: Prisma.ProductFindManyArgs = {};
    if (!pagination.all) {
      paginationArgs = {
        skip: (pagination.page - 1) * pagination.take,
        take: pagination.take,
      };
    }
    const { data, meta } = await this.prisma.$transaction(async (tx) => {
      const data = await tx.product.findMany({
        where,
        include: {
          ProductImage: {
            where: { isThumbnail: true },
            take: 1,
          },
          Stock: {
            select: {
              id: true,
              quantity: true,
            },
          },
          ProductCategory: true,
        },
        ...paginationArgs,
      });
      const count = await tx.product.count({ where });
      return {
        data,
        meta: this.paginationService.generateMeta({
          page: pagination.page,
          take: pagination.all ? count : pagination.take,
          count,
        }),
      };
    });
    return {
      data,
      meta,
      message: "Products retrieved successfully",
    };
  };

  public getProductDetails = async (slug: string) => {
    const data = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        ProductImage: true,
        UnitProduct: {
          orderBy: { isMain: "desc" },
        },
        ProductCategory: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        Stock: {
          select: {
            id: true,
            quantity: true,
            pharmacy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!data) {
      throw new ApiError("Product not found", 404);
    }
    return {
      message: "Product details retrieved successfully",
      data,
    };
  };

  // product info methods
  public createProductInfo = async (body: CreateProductInfoDTO) => {
    await this.validateProductName(body.name);
    await this.validateCategory(body.productCategory);
    const slug = generateSlug(body.name);
    await this.validateSlug(slug);
    const data = await this.prisma.$transaction(async (tx) => {
      const data = await tx.product.create({
        data: {
          name: body.name,
          nameMIMS: body.nameMIMS,
          golongan: body.golongan as Golongan,
          catCreate: body.catCreate as CatCreate,
          nomorEdar: body.nomorEdar,
          needsPrescription: body.needsPrescription,
          dose: body.dose,
          composition: body.composition,
          sideEffects: body.sideEffects,
          indication: body.indication,
          slug: slug,
          description: body.description,
          published: false,
        },
      });
      if (!data) {
        throw new ApiError("Failed to create product", 500);
      }
      await tx.productCategory.createMany({
        data: body.productCategory.map((categoryId) => ({
          productId: data.id,
          categoryId,
        })),
      });
    });
    return {
      message: "Product created successfully",
      data,
    };
  };

  public verifyExistingName = async (
    body: verifyExistingNameDTO,
    id?: string,
  ) => {
    const data = await this.validateProductName(body.name, id);
    return {
      data,
      message: "Verification completed",
    };
  };

  public updateProductInfo = async (id: string, body: UpdateProductInfoDTO) => {
    const existingProduct = await this.validateProductId(id);
    if (existingProduct.deletedAt) {
      throw new ApiError("Cannot update a deleted product", 410);
    }
    const productUpdateData: Partial<Product> = body;
    if (body.name) {
      await this.validateProductName(body.name, id);
      const slug = generateSlug(body.name);
      await this.validateSlug(slug, id);
      productUpdateData.slug = slug;
    }
    if (body.productCategory) {
      await this.validateCategory(body.productCategory);
      await this.prisma.productCategory.deleteMany({
        where: { productId: id },
      });
      await this.prisma.productCategory.createMany({
        data: body.productCategory.map((categoryId) => ({
          productId: id,
          categoryId,
        })),
      });
    }
    if (body.name || body.nameMIMS) {
      const slug = generateSlug(body.name || existingProduct.name);
      await this.validateSlug(slug, id);
      productUpdateData.slug = slug;
    }
    const data = await this.prisma.product.update({
      where: { id },
      data: productUpdateData,
    });

    if (!data) {
      throw new ApiError("Failed to update product", 500);
    }
    return {
      message: "Product updated successfully",
      data,
    };
  };

  // product image methods
  public uploadProductImage = async (
    id: string,
    image: Express.Multer.File,
    body: ProductImageDTO,
  ) => {
    const existingThumbnail = await this.existingThumbnailCheck(id);
    const { secure_url } = await this.fileService.upload(image);
    const data = await this.prisma.productImage.create({
      data: {
        imageUrl: secure_url,
        productId: id,
        isThumbnail: existingThumbnail ? false : true,
      },
    });
    body.isThumbnail && existingThumbnail
      ? await this.changeThumbnail(id, data.id)
      : data;
    return {
      message: "Product image created successfully",
      data,
    };
  };

  public updateToThumbnail = async (id: string) => {
    const existingImage = await this.prisma.productImage.findUnique({
      where: { id },
    });
    if (!existingImage) {
      throw new ApiError("Product image not found", 404);
    }
    const updatedThumbnail = await this.changeThumbnail(
      existingImage.productId,
      existingImage.id,
    );
    return {
      message: "Product image updated to thumbnail successfully",
      data: updatedThumbnail,
    };
  };

  public deleteProductImage = async (id: string) => {
    const existingProductImage = await this.prisma.productImage.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!existingProductImage) {
      throw new ApiError("Product image not found", 404);
    }
    if (existingProductImage.isThumbnail) {
      throw new ApiError("Cannot delete thumbnail image", 400);
    }
    if (existingProductImage.product.deletedAt) {
      throw new ApiError("Cannot delete image of a deleted product", 410);
    }
    await this.fileService.remove(existingProductImage.imageUrl);
    const data = await this.prisma.productImage.delete({
      where: { id },
    });
    return {
      message: "Product image deleted successfully",
      data,
    };
  };
  // unit product methods
  public createUnitProduct = async (id: string, body: CreateUnitProductDTO) => {
    await this.validateProductId(id);
    const excitingMain = await this.excitingMainUnitProductCheck(id);
    body.isMain = !excitingMain || body.isMain;
    const data = await this.prisma.$transaction(async (tx) => {
      const newUnit = await tx.unitProduct.create({
        data: {
          productId: id,
          ...body,
        },
      });
      if (body.isMain) {
        await tx.unitProduct.updateMany({
          where: { productId: id, isMain: true },
          data: { isMain: false },
        });
      }
      if (body.isMain) {
        await this.changeMainUnitProduct(id, newUnit.id);
      }
      return newUnit;
    });
    return {
      message: "Unit product created successfully",
      data,
    };
  };

  public updateUnitProduct = async (id: string, body: UpdateUnitProductDTO) => {
    const excitingUnitProduct = await this.excitingUnitProductCheck(id);
    if (!excitingUnitProduct) {
      throw new ApiError("Unit product not found", 404);
    }
    if (excitingUnitProduct.Product.deletedAt) {
      throw new ApiError("Cannot update a deleted product", 410);
    }
    if (body.isMain !== undefined && body.isMain) {
      await this.changeMainUnitProduct(id, excitingUnitProduct.id);
    } else if (body.isMain !== undefined && !body.isMain) {
      const existingMainUnit = await this.excitingMainUnitProductCheck(
        excitingUnitProduct.Product.id,
      );
      if (existingMainUnit && existingMainUnit.id === id) {
        throw new ApiError("Cannot set the main unit product as non-main", 400);
      }
    }
    const data = await this.prisma.unitProduct.update({
      where: { id: id },
      data: body,
    });
    return {
      message: "Unit product updated successfully",
      data,
    };
  };

  public deleteUnitProduct = async (id: string) => {
    const excitingUnitProduct = await this.excitingUnitProductCheck(id);
    if (!excitingUnitProduct) {
      throw new ApiError("Unit product not found", 404);
    }
    if (excitingUnitProduct.Product.deletedAt) {
      throw new ApiError("Cannot delete a unit of a deleted product", 410);
    }
    if (excitingUnitProduct.isMain) {
      throw new ApiError("Cannot delete the main unit product", 400);
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const data = await this.prisma.unitProduct.delete({
        where: { id },
      });
      await tx.cart.deleteMany({
        where: { unitId: id },
      });

      return data;
    });
    return {
      message: "Unit product deleted successfully",
      data: result,
    };
  };
}
