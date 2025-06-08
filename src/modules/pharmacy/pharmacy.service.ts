import { Prisma } from "@prisma/client";
import { injectable } from "tsyringe";
import { ApiError } from "../../utils/api-error";
import { generateSlug } from "../../utils/generate-slug";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PaginationService } from "../pagination/pagination.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePharmacyDTO } from "./dto/create-pharmacy.dto";
import { GetPharmaciesDTO } from "./dto/get-pharmacies.dto";
import { UpdatePharmacyDTO } from "./dto/update-pharmacy.dto";

@injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly fileService: CloudinaryService,
  ) {}

  private async validatePharmacyName(name: string, id?: string) {
    const existingPharmacy = await this.prisma.pharmacy.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        id: id ? { not: id } : undefined,
      },
    });
    if (existingPharmacy) {
      throw new ApiError("Pharmacy with this name already exists", 400);
    }
  }

  private async getPharmacyById(id: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id, deletedAt: null },
    });
    if (!pharmacy) {
      throw new ApiError("Pharmacy not found", 404);
    }
    return pharmacy;
  }

  createPharmacy = async (
    dto: CreatePharmacyDTO,
    pictureFile?: Express.Multer.File,
  ) => {
    await this.validatePharmacyName(dto.name);
    const slug = generateSlug(dto.name);

    let pictureUrl = dto.picture;
    if (pictureFile) {
      const { secure_url } = await this.fileService.upload(pictureFile);
      pictureUrl = secure_url;
    }

    return this.prisma.$transaction(async (tx) => {
      const pharmacyCount = await tx.pharmacy.count({
        where: { deletedAt: null },
      });
      if (pharmacyCount === 0) {
        dto.isMain = true;
      } else if (dto.isMain) {
        await tx.pharmacy.updateMany({
          where: { isMain: true },
          data: { isMain: false },
        });
      }

      const newPharmacy = await tx.pharmacy.create({
        data: {
          ...dto,
          slug,
          picture: pictureUrl,
        },
      });

      const allProducts = await tx.product.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });

      if (allProducts.length > 0) {
        await tx.stock.createMany({
          data: allProducts.map((product) => ({
            productId: product.id,
            pharmacyId: newPharmacy.id,
            quantity: 0,
          })),
        });
      }

      return {
        data: newPharmacy,
        message: "Pharmacy created successfully",
      };
    });
  };

  getPharmacies = async (query: GetPharmaciesDTO) => {
    const { search, page, take, sortBy, sortOrder, all } = query;
    const where: Prisma.PharmacyWhereInput = {
      deletedAt: null,
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { detailLocation: { contains: search, mode: "insensitive" } },
      ];
    }
    let paginationArgs: Prisma.PharmacyFindManyArgs = {};
    if (!all) {
      paginationArgs = {
        skip: (page - 1) * take,
        take,
      };
    }
    const count = await this.prisma.pharmacy.count({ where });
    const result = await this.prisma.pharmacy.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      ...paginationArgs,
    });
    return {
      data: result,
      meta: this.paginationService.generateMeta({
        page,
        take: all ? count : take,
        count,
      }),
      message: "Pharmacies fetched successfully",
    };
  };

  getPharmacy = async (id: string) => {
    const data = await this.getPharmacyById(id);
    return {
      data,
      message: "Pharmacy fetched successfully",
    };
  };

  updatePharmacy = async (
    id: string,
    dto: UpdatePharmacyDTO,
    pictureFile?: Express.Multer.File,
  ) => {
    return this.prisma.$transaction(async (tx) => {
      const existingPharmacy = await tx.pharmacy.findUnique({
        where: { id, deletedAt: null },
      });
      if (!existingPharmacy) {
        throw new ApiError("Pharmacy not found", 404);
      }

      if (dto.name) {
        await this.validatePharmacyName(dto.name, id);
      }

      let pictureUrl = dto.picture;
      if (pictureFile) {
        if (existingPharmacy.picture) {
          await this.fileService.remove(existingPharmacy.picture);
        }
        const { secure_url } = await this.fileService.upload(pictureFile);
        pictureUrl = secure_url;
      }

      if (dto.isMain === true) {
        await tx.pharmacy.updateMany({
          where: { isMain: true, NOT: { id } },
          data: { isMain: false },
        });
      } else if (dto.isMain === false && existingPharmacy.isMain) {
        throw new ApiError("Cannot demote the main pharmacy directly. Please set another pharmacy as main.", 400);
      }

      const updatedPharmacy = await tx.pharmacy.update({
        where: { id },
        data: {
          ...dto,
          slug: dto.name ? generateSlug(dto.name) : undefined,
          picture: pictureUrl,
        },
      });

      return {
        data: updatedPharmacy,
        message: "Pharmacy updated successfully",
      };
    });
  };

  deletePharmacy = async (id: string) => {
    const pharmacy = await this.getPharmacyById(id);
    if (pharmacy.isMain) {
      throw new ApiError("Cannot delete the main pharmacy", 400);
    }
    
    return this.prisma.$transaction(async (tx) => {
      await tx.pharmacy.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.stock.updateMany({
        where: { pharmacyId: id },
        data: { deletedAt: new Date() },
      });
      return { message: "Pharmacy deleted successfully" };
    });
  };
}
