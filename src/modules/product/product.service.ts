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
import e from "cors";

@injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly fileService: CloudinaryService,
  ) {}

  private async validateProductId(tx: Prisma.TransactionClient, id: string) {
    const product = await tx.product.findUnique({
      where: { id },
      include: {
        ProductImage: true,
        UnitProduct: true,
        ProductCategory: true,
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

  private async validateProductName(
    tx: Prisma.TransactionClient,
    name: string,
    id?: string,
  ) {
    const existingProduct = await tx.product.findFirst({
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

  private async validateCategory(tx: Prisma.TransactionClient, id: string[]) {
    const existingCategories = await tx.category.findMany({
      where: {
        id: { in: id },
      },
    });
    if (existingCategories.length === 0) {
      throw new ApiError("One or more categories do not exist", 400);
    }
    return true;
  }

  private async validateSlug(
    tx: Prisma.TransactionClient,
    slug: string,
    id?: string,
  ) {
    const existingProduct = await tx.product.findFirst({
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

  private existingThumbnailCheck = async (
    tx: Prisma.TransactionClient,
    id: string,
  ) => {
    const existingThumbnail = await tx.productImage.findFirst({
      where: { productId: id, isThumbnail: true },
    });
    return existingThumbnail;
  };

  private changeNotThumbnail = async (
    tx: Prisma.TransactionClient,
    idProduct: string,
  ) => {
    const existingProduct = await this.validateProductId(tx, idProduct);
    if (existingProduct.ProductImage.length === 0) {
      return true;
    }
    await tx.productImage.updateMany({
      where: { productId: idProduct, isThumbnail: true },
      data: { isThumbnail: false },
    });
    return true;
  };

  private async existingUnitProductCheck(
    tx: Prisma.TransactionClient,
    id: string,
  ) {
    const existingUnitProduct = await tx.unitProduct.findFirst({
      where: { id: id },
      include: {
        Product: {
          include: { UnitProduct: true },
        },
      },
    });
    return existingUnitProduct;
  }

  private async changeNotMainUnitProduct(
    tx: Prisma.TransactionClient,
    productId: string,
    mainRatio: number = 1,
  ) {
    const excitingProduct = await this.validateProductId(tx, productId);
    if (excitingProduct.UnitProduct.length > 0) {
      await tx.unitProduct.updateMany({
        where: { productId: productId },
        data: { isMain: false, ratioToMain: { divide: mainRatio } },
      });
    }
    return true;
  }

  validateUnitProductName = async (
    tx: Prisma.TransactionClient,
    name: string,
    idProduct: string,
    idUnitProduct?: string,
  ) => {
    const existingUnitProduct = await tx.unitProduct.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        productId: idProduct,
        id: idUnitProduct ? { not: idUnitProduct } : undefined,
      },
    });
    if (existingUnitProduct) {
      throw new ApiError("Unit product with this name already exists", 400);
    }
    return true;
  };

  // core service methods
  public publishProduct = async (id: string) => {
    const data = await this.prisma.$transaction(async (tx) => {
      const existingProduct = await this.validateProductId(tx, id);
      if (existingProduct.deletedAt)
        throw new ApiError("Cannot publish a deleted product", 410);
      if (existingProduct.published)
        throw new ApiError("Product is already published", 400);
      if (existingProduct.UnitProduct.length <= 0)
        throw new ApiError(
          "Product must have at least one unit to publish",
          400,
        );
      if (existingProduct.ProductImage.length <= 0)
        throw new ApiError(
          "Product must have at least one image to publish",
          400,
        );
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
    this.prisma.$transaction(async (tx) => {
      const existingProduct = await this.validateProductId(tx, id);
      if (existingProduct.deletedAt)
        throw new ApiError("Product has already been deleted", 410);
      if (!existingProduct.published) {
        if (existingProduct.UnitProduct.length > 0) {
          await tx.unitProduct.deleteMany({ where: { productId: id } });
        }
        if (existingProduct.ProductImage.length > 0) {
          existingProduct.ProductImage.forEach(async (image) => {
            await this.fileService.remove(image.imageUrl);
          });
          await tx.productImage.deleteMany({ where: { productId: id } });
        }
        if (existingProduct.ProductCategory.length > 0) {
          await tx.productCategory.deleteMany({ where: { productId: id } });
        }
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
    const { data, meta } = await this.prisma.$transaction(async (tx) => {
      const { search, categoryId, pharmacyId, ...pagination } = query;
      const where: Prisma.ProductWhereInput = {
        deletedAt: null,
        published: true,
        needsPrescription: false,
      };
      if (search) {
        where.name = {
          contains: search,
          mode: "insensitive",
        };
      }
      if (categoryId && categoryId.length > 0) {
        await this.validateCategory(tx, categoryId);
        where.ProductCategory = {
          some: {
            categoryId: { in: categoryId },
          },
        };
      }

      if (pharmacyId) {
        const existingPharmacy = await tx.pharmacy.findUnique({
          where: { id: pharmacyId },
        });
        if (!existingPharmacy) {
          throw new ApiError("Pharmacy not found", 404);
        }
        where.Stock = {
          some: {
            pharmacyId,
          },
        };
      } else {
        const mainPharmacy = await tx.pharmacy.findFirst({
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
      const data = await tx.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          golongan: true,
          catCreate: true,
          ProductImage: {
            where: { isThumbnail: true },
            take: 1,
          },
          Stock: {
            select: {
              quantity: true,
            },
          },
          ProductCategory: {
            select: {
              category: {
                select: {
                  name: true,
                  color: true,
                },
              },
            },
          },
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

  public getAdminProducts = async (query: GetProductsDTO) => {
    const { data, meta } = await this.prisma.$transaction(async (tx) => {
      const { search, categoryId, pharmacyId, ...pagination } = query;
      const where: any = {
        deletedAt: null,
      };
      if (search) {
        where.name = {
          contains: search,
          mode: "insensitive",
        };
      }
      if (categoryId && categoryId.length > 0) {
        await this.validateCategory(tx, categoryId);
        where.ProductCategory = {
          some: {
            categoryId: { in: categoryId },
          },
        };
      }

      if (pharmacyId) {
        const existingPharmacy = await tx.pharmacy.findUnique({
          where: { id: pharmacyId },
        });
        if (!existingPharmacy) {
          throw new ApiError("Pharmacy not found", 404);
        }
        where.Stock = {
          some: {
            pharmacyId,
          },
        };
      }

      let paginationArgs: Prisma.ProductFindManyArgs = {};
      if (!pagination.all) {
        paginationArgs = {
          skip: (pagination.page - 1) * pagination.take,
          take: pagination.take,
        };
      }
      const data = await tx.product.findMany({
        where,
        include: {
          ProductImage: {
            where: { isThumbnail: true },
            take: 1,
          },
          Stock: {
            select: {
              quantity: true,
            },
          },
          ProductCategory: {
            select: {
              category: {
                select: {
                  name: true,
                  color: true,
                },
              },
            },
          },
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

  public getDashboardProducts = async () => {
    const data = {
      totalproducts: 0,
      totalpublished: 0,
      totalunpublished: 0,
      totalcategories: 0,
      averageDefaultPrice: 0,
    };

    const totalProducts = await this.prisma.product.count({
      where: { deletedAt: null },
    });
    const totalPublished = await this.prisma.product.count({
      where: { published: true, deletedAt: null },
    });
    const totalUnpublished = await this.prisma.product.count({
      where: { published: false, deletedAt: null },
    });
    const totalCategories = await this.prisma.category.count({});
    const averageDefaultPrice = await this.prisma.unitProduct.aggregate({
      _avg: {
        price: true,
      },
      where: { isMain: true },
    });
    data.totalproducts = totalProducts;
    data.totalpublished = totalPublished;
    data.totalunpublished = totalUnpublished;
    data.totalcategories = totalCategories;
    data.averageDefaultPrice = averageDefaultPrice._avg.price || 0;
    return {
      message: "Admin dashboard products data retrieved successfully",
      data,
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
    const data = await this.prisma.$transaction(async (tx) => {
      await this.validateProductName(tx, body.name);
      await this.validateCategory(tx, body.productCategory);
      const slug = generateSlug(body.name);
      await this.validateSlug(tx, slug);
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
      return data;
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
    const result = await this.prisma.$transaction(async (tx) => {
      const data = await this.validateProductName(tx, body.name, id);
      return data;
    });
    return {
      data: result,
      message: "Verification completed",
    };
  };

  public updateProductInfo = async (id: string, body: UpdateProductInfoDTO) => {
    console.log("updateProductInfo body", body);
    const result = await this.prisma.$transaction(async (tx) => {
      const existingProduct = await this.validateProductId(tx, id);
      if (existingProduct.deletedAt) {
        throw new ApiError("Cannot update a deleted product", 410);
      }
      const productUpdateData: Partial<Product> = body;
      if (body.name) {
        await this.validateProductName(tx, body.name, id);
        const slug = generateSlug(body.name);
        await this.validateSlug(tx, slug, id);
        productUpdateData.slug = slug;
      }
      if (body.productCategory) {
        await this.validateCategory(tx, body.productCategory);
        await tx.productCategory.deleteMany({
          where: { productId: id },
        });
        await tx.productCategory.createMany({
          data: body.productCategory.map((categoryId) => ({
            productId: id,
            categoryId,
          })),
        });
      }
      const { productCategory, ...dataOmitCategory } = body;

      const data = await tx.product.update({
        where: { id },
        data: { ...dataOmitCategory },
      });

      if (!data) {
        throw new ApiError("Failed to update product", 500);
      }
      return data;
    });
    return {
      message: "Product updated successfully",
      data: result,
    };
  };

  // product image methods
  public uploadProductImage = async (
    id: string,
    image: Express.Multer.File,
    body: ProductImageDTO,
  ) => {
    const data = await this.prisma.$transaction(async (tx) => {
      const existingProduct = await this.validateProductId(tx, id);
      const existingThumbnail = await this.existingThumbnailCheck(tx, id);
      if (existingProduct.deletedAt) {
        throw new ApiError("Cannot upload image for a deleted product", 410);
      }
      if (existingProduct.ProductImage.length >= 5) {
        throw new ApiError("Product already has 5 images", 400);
      }
      if (!existingThumbnail) {
        body.isThumbnail = true;
      }
      if (existingThumbnail && body.isThumbnail) {
        await this.changeNotThumbnail(tx, id);
      }
      const { secure_url } = await this.fileService.upload(image);
      if (!secure_url) {
        throw new ApiError("Failed to upload image", 500);
      }
      const data = await tx.productImage.create({
        data: {
          imageUrl: secure_url,
          productId: id,
          isThumbnail: body.isThumbnail,
        },
      });
      return data;
    });
    return {
      message: "Product image created successfully",
      data,
    };
  };

  public updateToThumbnail = async (id: string) => {
    const result = await this.prisma.$transaction(async (tx) => {
      const existingImage = await tx.productImage.findUnique({
        where: { id },
      });
      if (!existingImage) {
        throw new ApiError("Product image not found", 404);
      }
      await this.changeNotThumbnail(tx, existingImage.productId);
      const updatedThumbnail = await tx.productImage.update({
        where: { id },
        data: { isThumbnail: true },
      });
      return updatedThumbnail;
    });
    return {
      message: "Product image updated to thumbnail successfully",
      data: result,
    };
  };

  public deleteProductImage = async (id: string) => {
    const existingProductImage = await this.prisma.productImage.findUnique({
      where: { id },
      include: {
        product: {
          include: { ProductImage: true },
        },
      },
    });
    if (!existingProductImage) {
      throw new ApiError("Product image not found", 404);
    }
    if (
      existingProductImage.product.ProductImage.length > 1 &&
      existingProductImage.isThumbnail
    ) {
      throw new ApiError("Cannot delete thumbnail image", 400);
    }
    if (
      existingProductImage.product.published &&
      existingProductImage.isThumbnail
    ) {
      throw new ApiError(
        "Cannot delete thumbnail image of a published product",
        400,
      );
    }
    if (existingProductImage.product.deletedAt) {
      throw new ApiError("Cannot delete image of a deleted product", 410);
    }
    if (
      existingProductImage.product.published &&
      existingProductImage.product.ProductImage.length <= 1
    ) {
      throw new ApiError(
        "Cannot delete the last image of a published product",
        400,
      );
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
    const data = await this.prisma.$transaction(async (tx) => {
      const excitingProduct = await this.validateProductId(tx, id);

      if (excitingProduct.UnitProduct.length >= 5) {
        throw new ApiError("Product already has 5 units", 400);
      }
      if (excitingProduct.deletedAt) {
        throw new ApiError("Cannot create unit for a deleted product", 410);
      }
      const excitingMain = await tx.unitProduct.findFirst({
        where: { productId: id, isMain: true },
      });
      body.isMain = !excitingMain || body.isMain;
      await this.validateUnitProductName(tx, body.name, id);
      if (body.isMain) {
        body.ratioToMain = 1;
        await this.changeNotMainUnitProduct(tx, id);
      }

      const newUnit = await tx.unitProduct.create({
        data: {
          productId: id,
          ...body,
        },
      });

      return newUnit;
    });
    return {
      message: "Unit product created successfully",
      data,
    };
  };

  public updateUnitProduct = async (id: string, body: UpdateUnitProductDTO) => {
    const data = await this.prisma.$transaction(async (tx) => {
      const excitingUnitProduct = await this.existingUnitProductCheck(tx, id);
      if (!excitingUnitProduct) {
        throw new ApiError("Unit product not found", 404);
      }
      if (excitingUnitProduct.Product.deletedAt) {
        throw new ApiError("Cannot update a deleted product", 410);
      }
      if (body.isMain !== undefined && body.isMain) {
        await this.changeNotMainUnitProduct(
          tx,
          excitingUnitProduct.productId,
          excitingUnitProduct.ratioToMain,
        );
        body.ratioToMain = 1;
      } else if (
        body.isMain !== undefined &&
        excitingUnitProduct.isMain &&
        !body.isMain
      ) {
        throw new ApiError("Cannot set the main unit product as non-main", 400);
      }
      if (body.name) {
        await this.validateUnitProductName(
          tx,
          body.name,
          excitingUnitProduct.productId,
          id,
        );
      }
      console.log("to update");

      const data = await tx.unitProduct.update({
        where: { id: id },
        data: { ...body },
      });
      return data;
    });
    return {
      message: "Unit product updated successfully",
      data,
    };
  };

  public deleteUnitProduct = async (id: string) => {
    const result = await this.prisma.$transaction(async (tx) => {
      const excitingUnitProduct = await this.existingUnitProductCheck(tx, id);
      if (!excitingUnitProduct) {
        throw new ApiError("Unit product not found", 404);
      }
      if (excitingUnitProduct.Product.deletedAt) {
        throw new ApiError("Cannot delete a unit of a deleted product", 410);
      }
      if (
        excitingUnitProduct.Product.published &&
        excitingUnitProduct.Product.UnitProduct.length > 1 &&
        excitingUnitProduct.isMain
      ) {
        throw new ApiError("Cannot delete the main unit product", 400);
      }
      if (
        excitingUnitProduct.Product.published &&
        excitingUnitProduct.Product.UnitProduct.length <= 1
      ) {
        throw new ApiError(
          "Cannot delete the last unit of a published product",
          400,
        );
      }
      const data = await tx.unitProduct.delete({
        where: { id },
      });
      const excitingCart = await tx.cart.findMany({
        where: { unitId: id },
      });
      if (excitingCart.length > 0) {
        await tx.cart.deleteMany({
          where: { unitId: id },
        });
      }

      return data;
    });
    return {
      message: "Unit product deleted successfully",
      data: result,
    };
  };
}
