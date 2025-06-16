import { Prisma } from "@prisma/client";
import { injectable } from "tsyringe";
import { PaginationService } from "../pagination/pagination.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDTO } from "./dto/create-category.dto";
import { UpdateCategoryDTO } from "./dto/update-category.dto";
import { ApiError } from "../../utils/api-error";
import { GetCategoriesDTO } from "./dto/get-categories.dto";

@injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  private ValidateCategoryName = async (name: string, id?: string) => {
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name,
        id: id ? { not: id } : undefined,
      },
    });
    if (existingCategory) {
      throw new ApiError("Category with this name already exists", 400);
    }
    return true;
  };

  private getCategoryById = async (id: string) => {
    if (!id) {
      throw new ApiError("Category ID is required", 400);
    }
    const data = await this.prisma.category.findFirstOrThrow({
      where: { id },
      include: {
        ProductCategory: {
          where: {
            product: { deletedAt: null },
          },
        },
      },
    });
    return {
      data,
      message: "Category fetched successfully",
    };
  };

  public createCategory = async (dto: CreateCategoryDTO) => {
    const { name, description, color } = dto;
    await this.ValidateCategoryName(name);
    const data = await this.prisma.category.create({
      data: {
        name,
        description,
      },
    });
    return {
      data,
      message: "Category created successfully",
    };
  };

  public getCategory = async (id: string) => {
    return this.getCategoryById(id);
  };

  public getCategories = async (body: GetCategoriesDTO) => {
    const { search, page, take, sortBy, sortOrder, all } = body;
    const whereClause: Prisma.CategoryWhereInput = {};
    if (search) {
      whereClause.name = { contains: search, mode: "insensitive" };
    }
    let paginationArgs: Prisma.CategoryFindManyArgs = {};
    if (!all) {
      paginationArgs = {
        skip: (page - 1) * take,
        take,
      };
    }
    const count = await this.prisma.category.count({ where: whereClause });
    const result = await this.prisma.category.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortOrder,
      },
      ...paginationArgs,
      include: {
        _count: {
          select: {
            ProductCategory: {
              where: {
                product: { deletedAt: null },
              },
            },
          },
        },
      },
    });
    return {
      data: result,
      meta: this.paginationService.generateMeta({
        page,
        take: all ? count : take,
        count,
      }),
      message: "Categories fetched successfully",
    };
  };

  public updateCategory = async (id: string, body: UpdateCategoryDTO) => {
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory.data) {
      throw new ApiError("Category not found", 404);
    }
    if (body.name) {
      await this.ValidateCategoryName(body.name, id);
    }
    const data = await this.prisma.category.update({
      where: { id },
      data: body,
    });
    return {
      data,
      message: "Category updated successfully",
    };
  };

  public deleteCategory = async (id: string) => {
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory.data) {
      throw new ApiError("Category not found", 404);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.productCategory.deleteMany({
        where: { categoryId: id },
      });
      await tx.category.delete({
        where: { id },
      });
    });

    return { message: "Category deleted successfully" };
  };
}
