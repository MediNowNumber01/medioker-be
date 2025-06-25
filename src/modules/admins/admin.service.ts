import { injectable } from "tsyringe";
import { PrismaService } from "../prisma/prisma.service";
import { PaginationService } from "../pagination/pagination.service";
import { GetAdminsDTO } from "./dto/get-admins.dto";
import { Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error";

@injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  public getAdmins = async (query: GetAdminsDTO) => {
    const { search, page, take, sortBy, sortOrder, all } = query;
    const where: Prisma.AdminWhereInput = {
      account: {
        deletedAt: null,
        isVerified: true,
        ...(search && { fullName: { contains: search, mode: "insensitive" } }),
      },
    };
    if (query.role) {
      where.adminRole = query.role;
    }

    if (query.status !== undefined) {
      where.pharmacyId =
        query.status === "true" ? { not: null } : { equals: null };
    }

    if (query.notOnPharmacy) {
      const pharmacy = await this.prisma.pharmacy.findUnique({
        where: { id: query.notOnPharmacy },
      });
      if (!pharmacy) {
        throw new ApiError("Pharmacy not found", 404);
      }
    }
    where.pharmacyId =
      query.status === "true"
        ? {
            notIn: query.notOnPharmacy ? [query.notOnPharmacy] : undefined,
          }
        : query.status === "false"
          ? {
              equals: null,
            }
          : undefined;

    let paginationArgs: Prisma.AdminFindManyArgs = {};
    if (!all) {
      paginationArgs = {
        skip: (page - 1) * take,
        take,
      };
    }
    const count = await this.prisma.admin.count({ where });
    const result = await this.prisma.admin.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      ...paginationArgs,
      include: {
        account: true,
      },
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

  getAdminDetail = async (id: string) => {
    const data = await this.prisma.admin.findUnique({
      where: { id },
      include: {
        account: true,
      },
    });
    return {
      data,
      message: "Admin fetched successfully",
    };
  };
}
