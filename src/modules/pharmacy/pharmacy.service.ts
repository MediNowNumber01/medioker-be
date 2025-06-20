import { AdminRole, Prisma } from "@prisma/client";
import { injectable } from "tsyringe";
import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PaginationService } from "../pagination/pagination.service";
import { PrismaService } from "../prisma/prisma.service";
import { assignEmployeePharmacyDTO } from "./dto/assignEmployeePharmacy.dto";
import { CreatePharmacyDTO } from "./dto/create-pharmacy.dto";
import { GetPharmaciesDTO } from "./dto/get-pharmacies.dto";
import { UpdatePharmacyDTO } from "./dto/update-pharmacy.dto";
import { VerifyNamePharmacyDTO } from "./dto/verify-name.dto";
import { GetPharmacyEmployeesDTO } from "./dto/get-pharmacy-employee.dto";

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

  public verifyPharmacyName = async (dto: VerifyNamePharmacyDTO) => {
    if (dto.id) {
      await this.getPharmacyById(this.prisma, dto.id, true);
    }
    const data = await this.validatePharmacyName(this.prisma, dto.name, dto.id);
    return {
      isValid: data,
      message: data
        ? "Pharmacy name is available"
        : "Pharmacy name already exists",
    };
  };

  public assignEmployeePharmacy = async (body: assignEmployeePharmacyDTO) => {
    await this.prisma.$transaction(async (tx) => {
      await this.getPharmacyById(tx, body.pharmacyId, true);
      if (body.adminId.length === 0) {
        throw new ApiError("At least one admin must be assigned", 400);
      }
      let PotadminsPharmacy: string[] = [];
      const ExistingAdmins = await tx.admin.findMany({
        where: { id: { in: body.adminId }, deleteAt: null },
        select: { id: true, pharmacyId: true },
      });
      if (ExistingAdmins.length !== body.adminId.length) {
        throw new ApiError("One or more admins not found", 404);
      }
      ExistingAdmins.forEach((admin) => {
        if (
          admin.pharmacyId !== null &&
          admin.pharmacyId !== body.pharmacyId &&
          !PotadminsPharmacy.includes(admin.id)
        ) {
          PotadminsPharmacy.push(admin.id);
        }
      });

      await tx.admin.updateMany({
        where: { id: { in: body.adminId } },
        data: { pharmacyId: body.pharmacyId },
      });
      await tx.pharmacy.update({
        where: { id: body.pharmacyId },
        data: { isOpen: true },
      });
      if (PotadminsPharmacy.length > 0) {
        const assignedPotAdmin = await tx.pharmacy.findMany({
          where: { id: { in: PotadminsPharmacy } },
          include: {
            Admin: true,
          },
        });
        await Promise.all(
          assignedPotAdmin.map(async (pharmacy) => {
            if (pharmacy.Admin.length < 1) {
              await tx.pharmacy.update({
                where: { id: pharmacy.id },
                data: { isOpen: false },
              });
            }
          }),
        );
      }
    });

    return {
      message: "Pharmacy assigned to admin successfully",
    };
  };

  public unassignEmployeePharmacy = async (employeeId: string) => {
    console.log("Unassigning employee from pharmacy", employeeId);
    if (!employeeId) {
      throw new ApiError("Employee ID is required", 400);
    }
    await this.prisma.$transaction(async (tx) => {
      const employee = await tx.admin.findUnique({
        where: { id: employeeId },
        select: { pharmacyId: true },
      });
      if (!employee || !employee.pharmacyId) {
        throw new ApiError(
          "Employee not found or not assigned to a pharmacy",
          404,
        );
      }
      const pharmacyEmployeeNumber = await tx.admin.count({
        where: { pharmacyId: employee.pharmacyId },
      });
      if (pharmacyEmployeeNumber <= 1) {
        await tx.pharmacy.update({
          where: { id: employee.pharmacyId },
          data: { isOpen: false },
        });
      }
      await tx.admin.update({
        where: { id: employeeId },
        data: { pharmacyId: null },
      });
    });
    return {
      message: "Pharmacy unassigned from employee successfully",
    };
  };

  public getAssignedEmployees = async (
    pharmacyId: string,
    query: GetPharmacyEmployeesDTO,
  ) => {
    const pharmacy = await this.getPharmacyById(this.prisma, pharmacyId, true);
    const { search, page, take, sortBy, sortOrder, role, all } = query;
    const where: Prisma.AdminWhereInput = {
      pharmacyId: pharmacy.id,
      deleteAt: null,
    };
    if (search) {
      console.log("search", search);
      where.account = { fullName: { contains: search, mode: "insensitive" } };
    }
    if (role && AdminRole[role as keyof typeof AdminRole]) {
      where.adminRole = role as AdminRole;
    }
    let paginationArgs: Prisma.AdminFindManyArgs = {};
    if (!all) {
      paginationArgs = {
        skip: (page - 1) * take,
        take,
      };
    }

    const employees = await this.prisma.admin.findMany({
      where,
      include: {
        account: true,
      },
      ...paginationArgs,
    });
    const count = await this.prisma.admin.count({ where });
    return {
      data: employees,
      message: "Assigned employees fetched successfully",
      meta: this.paginationService.generateMeta({
        page,
        take: all ? count : take,
        count,
      }),
    };
  };

  public getDashboardPharmacies = async () => {
    let totalPharmacies = 0;
    let openPharmacies = 0;
    let closedPharmacies = 0;
    let totalEmployees = 0;
    let assignedEmployees = 0;
    let unassignedEmployees = 0;
    const pharmacies = await this.prisma.pharmacy.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { Admin: true },
        },
      },
    });
    const employees = await this.prisma.admin.findMany({
      where: { deleteAt: null, pharmacyId: { equals: null } },
    });
    unassignedEmployees = employees.length;
    totalPharmacies = pharmacies.length;
    openPharmacies = pharmacies.filter((p) => p.isOpen).length;
    closedPharmacies = pharmacies.filter((p) => !p.isOpen).length;
    assignedEmployees = pharmacies.filter((p) => p._count.Admin > 0).length;
    totalEmployees = assignedEmployees + unassignedEmployees;
    return {
      data: {
        totalPharmacies,
        openPharmacies,
        closedPharmacies,
        totalEmployees,
        assignedEmployees,
        unassignedEmployees,
      },
      message: "Dashboard pharmacies fetched successfully",
    };
  };

  public getPharmacies = async (query: GetPharmaciesDTO, isSuper: boolean) => {
    const { search, page, take, sortBy, sortOrder, all } = query;
    const where: Prisma.PharmacyWhereInput = {
      deletedAt: null,
    };
    if (!isSuper) {
      where.isOpen = true;
    } else if (query.isOpen !== undefined) {
      where.isOpen =
        query.isOpen === "open"
          ? true
          : query.isOpen === "closed"
            ? false
            : undefined;
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
      include: isSuper
        ? {
            _count: {
              select: { Admin: true },
            },
          }
        : undefined,
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
      const existingPharmacy = await this.getPharmacyById(tx, id, true);
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
      }
      await tx.admin.updateMany({
        where: { pharmacyId: id },
        data: { pharmacyId: null },
      });
      return { message: "Pharmacy deleted successfully" };
    });
  };
}
