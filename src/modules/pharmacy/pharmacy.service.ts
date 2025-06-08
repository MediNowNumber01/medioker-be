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
import { assignAdminPharmacyDTO } from "./dto/assignAdminPharmacy.dto";
import { VerifyNamePharmacyDTO } from "./dto/verify-name.dto";

@injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly fileService: CloudinaryService,
  ) {}

  private async validatePharmacyName(
    tx: Prisma.TransactionClient,
    name: string,
    id?: string,
  ) {
    const existingPharmacy = await tx.pharmacy.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        id: id ? { not: id } : undefined,
      },
    });
    if (existingPharmacy) {
      return false;
    }
    return true;
  }

  private async getPharmacyById(
    tx: Prisma.TransactionClient,
    id: string,
    isSuperAdmin: boolean,
  ) {
    const pharmacy = await tx.pharmacy.findUnique({
      where: { id, deletedAt: null },
    });
    if (!pharmacy) {
      throw new ApiError("Pharmacy not found", 404);
    }
    if (!isSuperAdmin && !pharmacy.isOpen) {
      throw new ApiError("Pharmacy is closed", 403);
    }
    return pharmacy;
  }

  public createPharmacy = async (
    body: CreatePharmacyDTO,
    pictureFile: Express.Multer.File,
  ) => {
    return this.prisma.$transaction(async (tx) => {
      const validName = await this.validatePharmacyName(tx, body.name);
      if (!validName) {
        throw new ApiError("Pharmacy name already exists", 400);
      }
      const slug = generateSlug(body.name);

      let pictureUrl = "";
      if (pictureFile) {
        const { secure_url } = await this.fileService.upload(pictureFile);
        pictureUrl = secure_url;
      }
      const pharmacyCount = await tx.pharmacy.count({
        where: { deletedAt: null },
      });
      if (pharmacyCount === 0) {
        body.isMain = true;
      } else if (body.isMain) {
        await tx.pharmacy.updateMany({
          where: { isMain: true },
          data: { isMain: false },
        });
      }

      const newPharmacy = await tx.pharmacy.create({
        data: {
          ...body,
          slug,
          isOpen: false,
          picture: pictureUrl,
        },
      });

      const allProducts = await tx.product.findMany({
        where: { deletedAt: null, published: true },
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

  public verifyPharmacyName = async (body: VerifyNamePharmacyDTO) => {
    if (body.id) {
      await this.getPharmacyById(this.prisma, body.id, true);
    }
    const data = await this.validatePharmacyName(
      this.prisma,
      body.name,
      body.id,
    );
    return {
      isValid: data,
      message: data
        ? "Pharmacy name is available"
        : "Pharmacy name already exists",
    };
  };

  public assignAdminPharmacy = async (body: assignAdminPharmacyDTO) => {
    await this.prisma.$transaction(async (tx) => {
      await this.getPharmacyById(tx, body.pharmacyId, true);
      const admin = await tx.admin.findUnique({
        where: { id: body.adminId },
        select: { id: true },
      });
      if (!admin) {
        throw new ApiError("Admin not found", 404);
      }
      await tx.admin.update({
        where: { id: body.adminId },
        data: { pharmacyId: body.pharmacyId },
      });
      await tx.pharmacy.update({
        where: { id: body.pharmacyId },
        data: { isOpen: true },
      });
    });
    return {
      message: "Pharmacy assigned to admin successfully",
    };
  };

  public unassignAdminPharmacy = async (adminId: string) => {
    await this.prisma.$transaction(async (tx) => {
      const admin = await tx.admin.findUnique({
        where: { id: adminId },
        select: { pharmacyId: true },
      });
      if (!admin || !admin.pharmacyId) {
        throw new ApiError(
          "Admin not found or not assigned to a pharmacy",
          404,
        );
      }
      const pharmacyAdminNumber = await tx.admin.count({
        where: { pharmacyId: admin.pharmacyId },
      });
      if (pharmacyAdminNumber <= 1) {
        await tx.pharmacy.update({
          where: { id: admin.pharmacyId },
          data: { isOpen: false },
        });
      }
      await tx.admin.update({
        where: { id: adminId },
        data: { pharmacyId: null },
      });
    });
    return {
      message: "Pharmacy unassigned from admin successfully",
    };
  };

  public getAssignedAdmins = async (pharmacyId: string) => {
    const pharmacy = await this.getPharmacyById(this.prisma, pharmacyId, true);
    const admins = await this.prisma.admin.findMany({
      where: { pharmacyId: pharmacy.id },
      include: {
        account: true,
      },
    });
    return {
      data: admins,
      message: "Assigned admins fetched successfully",
    };
  };

  public getPharmacies = async (query: GetPharmaciesDTO, isSuper: boolean) => {
    const { search, page, take, sortBy, sortOrder, all } = query;
    const where: Prisma.PharmacyWhereInput = {
      deletedAt: null,
    };
    if (!isSuper) {
      where.isOpen = true;
    }
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
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

  getPharmacy = async (id: string, isSuperAdmin: boolean) => {
    const data = await this.getPharmacyById(this.prisma, id, isSuperAdmin);
    return {
      data,
      message: "Pharmacy fetched successfully",
    };
  };

  public updatePharmacy = async (
    id: string,
    body: UpdatePharmacyDTO,
    pictureFile?: Express.Multer.File,
  ) => {
    return this.prisma.$transaction(async (tx) => {
      const existingPharmacy = await this.getPharmacyById(tx, id, false);
      if (!body.isMain && existingPharmacy.isMain) {
        throw new ApiError(
          "Cannot demote the main pharmacy directly. Please set another pharmacy as main.",
          400,
        );
      }

      if (body.name) {
        const validName = await this.validatePharmacyName(tx, body.name, id);
        if (!validName) {
          throw new ApiError("Pharmacy name already exists", 400);
        }
      }

      let pictureUrl = existingPharmacy.picture;
      if (pictureFile) {
        if (existingPharmacy.picture) {
          await this.fileService.remove(existingPharmacy.picture);
        }
        const { secure_url } = await this.fileService.upload(pictureFile);
        pictureUrl = secure_url;
      }

      if (body.isMain === true) {
        await tx.pharmacy.updateMany({
          where: { isMain: true, NOT: { id } },
          data: { isMain: false },
        });
      } else if (body.isMain === false && existingPharmacy.isMain) {
        throw new ApiError(
          "Cannot demote the main pharmacy directly. Please set another pharmacy as main.",
          400,
        );
      }

      const updatedPharmacy = await tx.pharmacy.update({
        where: { id },
        data: {
          ...body,
          slug: body.name ? generateSlug(body.name) : undefined,
          picture: pictureUrl,
        },
      });

      return {
        data: updatedPharmacy,
        message: "Pharmacy updated successfully",
      };
    });
  };

  public deletePharmacy = async (id: string) => {
    return this.prisma.$transaction(async (tx) => {
      const pharmacy = await this.getPharmacyById(tx, id, true);
      if (pharmacy.isMain) {
        throw new ApiError("Cannot delete the main pharmacy", 400);
      }
      const excitingOrder = await tx.order.findMany({
        where: { OrderStock: { some: { stock: { pharmacyId: id } } } },
        select: { id: true },
      });
      if (excitingOrder.length === 0) {
        await this.fileService.remove(pharmacy.picture);
        await tx.stock.deleteMany({
          where: { pharmacyId: id },
        });
        await tx.pharmacy.delete({
          where: { id },
        });
      } else {
        await tx.pharmacy.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
        await tx.stock.updateMany({
          where: { pharmacyId: id },
          data: { deletedAt: new Date() },
        });
      }
      await tx.cart.deleteMany({
        where: { stock: { pharmacyId: id } },
      });

      if (excitingOrder.length > 0) {
        await tx.orderActivity.createMany({
          data: excitingOrder.map((order) => ({
            orderId: order.id,
            status: "CANCELED",
          })),
        });
        await tx.order.updateMany({
          where: { OrderStock: { some: { stock: { pharmacyId: id } } } },
          data: {
            status: "CANCELED",
          },
        });
        await tx.orderStock.updateMany({
          where: { stock: { pharmacyId: id } },
          data: { deletedAt: new Date() },
        });
      }
      await tx.admin.updateMany({
        where: { pharmacyId: id },
        data: { pharmacyId: null },
      });
      return { message: "Pharmacy deleted successfully" };
    });
  };
}
