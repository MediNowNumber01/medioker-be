import { injectable } from "tsyringe";
import { PrismaService } from "../prisma/prisma.service";
import { PaginationService } from "../pagination/pagination.service";
import { GetAdminsDTO } from "./dto/get-admins.dto";
import { Prisma } from "@prisma/client";
import { ApiError } from "../../utils/api-error";
import { prismaExclude } from "../prisma/utils";
import { TokenService } from "../auth/token.service";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { UpdateAdminDTO } from "./dto/update-admin.dto";
import { PasswordService } from "../auth/password.service";
import { env } from "../../config";
import { MailService } from "../mail/mail.service";
import { CreateAdminDTO } from "./dto/create-admin.dto";

@injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly tokenService: TokenService,
    private readonly fileService: CloudinaryService,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService,
  ) {}
  public getAdmins = async (query: GetAdminsDTO) => {
    const { search, page, take, sortBy, sortOrder, all } = query;

    let where: Prisma.AdminWhereInput = {
      account: {
        role: "ADMIN",
        deletedAt: null,
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
    };

    let orderBy: Prisma.AdminOrderByWithRelationInput = {};
    if (sortBy === "fullName" || sortBy === "email" || sortBy === "createdAt") {
      orderBy = {
        account: {
          [sortBy]: sortOrder,
        },
      };
    } else if (sortBy) {
      orderBy = {
        [sortBy]: sortOrder,
      };
    } else {
      orderBy = {
        account: {
          createdAt: "desc",
        },
      };
    }
    let paginationArgs: Prisma.AdminFindManyArgs = {};
    if (!all) {
      paginationArgs = {
        skip: (page - 1) * take,
        take,
      };
    }
    const count = await this.prisma.admin.count({ where });
    const countVerified = await this.prisma.account.count({
      where: { isVerified: true, role: "ADMIN" },
    });
    const result = await this.prisma.admin.findMany({
      where,
      orderBy,
      ...paginationArgs,
      include: {
        account: true,
      },
    });
    return {
      data: result,
      countVerified,
      meta: this.paginationService.generateMeta({
        page,
        take: all ? count : take,
        count,
      }),
    };
  };

  getAdminDetail = async (id: string) => {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { id: true },
    });

    const data = await this.prisma.admin.findUnique({
      where: { accountId: account?.id, deleteAt: null },
      include: {
        account: { select: prismaExclude("Account", ["password"]) },
      },
    });
    return {
      data,
      message: "Admin fetched successfully",
    };
  };

  createAdmin = async (
    body: CreateAdminDTO,
    profilePict: Express.Multer.File,
  ) => {
    const { email, fullName, password, adminRole } = body;

    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (account) {
      throw new ApiError("Email is already exist", 409);
    }

    const accountId = await this.prisma.account.findUnique({
      where: { email },
      select: { id: true },
    });

    const hashedPassword = await this.passwordService.hashPassword(password);

    const { secure_url } = await this.fileService.upload(profilePict);
    const profileUrl = secure_url;

    if (adminRole === "DOCTOR" || adminRole === "PHARMACIST") {
      return await this.prisma.$transaction(async (tx) => {
        const newAdmin = await tx.account.create({
          data: {
            email,
            fullName,
            password: hashedPassword,
            profilePict: profileUrl,
            role: "ADMIN",
          },
          select: prismaExclude("Account", ["password"]),
        });

        const token = this.tokenService.generateToken(
          { id: accountId },
          env().JWT_SECRET_VERIFY!,
          { expiresIn: "1h" },
        );
        const verifyLink = `${env().BASE_URL_FE}/verify/${token}`;

        await tx.account.update({
          where: { id: newAdmin.id },
          data: { verifyToken: token },
        });

        this.mailService.sendEmail(email, "Verify Account", "admin-verify", {
          fullName,
          email,
          adminRole,
          verificationUrl: verifyLink,
        });

        await tx.admin.create({
          data: { adminRole, accountId: newAdmin.id, validToAnswerForum: true },
        });

        return newAdmin;
      });
    } else if (adminRole === "CASHIER") {
      return await this.prisma.$transaction(async (tx) => {
        const newAdmin = await tx.account.create({
          data: {
            email,
            fullName,
            password: hashedPassword,
            profilePict: profileUrl,
            role: "ADMIN",
          },
          select: prismaExclude("Account", ["password"]),
        });
        const token = this.tokenService.generateToken(
          { id: accountId },
          env().JWT_SECRET_VERIFY!,
          { expiresIn: "1h" },
        );
        const verifyLink = `${env().BASE_URL_FE}/verify/${token}`;

        await tx.account.update({
          where: { id: newAdmin.id },
          data: { verifyToken: token },
        });

        this.mailService.sendEmail(email, "Verify Account", "admin-verify", {
          fullName,
          email,
          adminRole,
          verificationUrl: verifyLink,
        });
        await tx.admin.create({
          data: {
            adminRole,
            accountId: newAdmin.id,
            validToAnswerForum: false,
          },
        });

        return newAdmin;
      });
    }
  };
  deleteAdmin = async (accountId: string) => {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new ApiError("Account not found", 400);
    }

    if (account.deletedAt !== null) {
      throw new ApiError(
        `Account has been deleted at ${account.deletedAt}`,
        404,
      );
    }

    // await this.fileService.remove(account.profilePict!);
    await this.prisma.$transaction(async (tx) => {
      await tx.admin.update({
        where: { accountId },
        data: { deleteAt: new Date() },
      });
      await tx.account.update({
        where: { id: accountId },
        data: { deletedAt: new Date(), profilePict: "" },
      });
    });

    return { message: "Delete admin success" };
  };

  updateAdmin = async (
    accountId: string,
    body: UpdateAdminDTO,
    profilePict?: Express.Multer.File,
  ) => {
    const { adminRole, email, fullName, password } = body;
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { Admin: true },
    });

    if (!account) {
      throw new ApiError("Account not found", 400);
    }
    let newFullName = account.fullName;
    if (fullName) {
      newFullName = fullName;
    }

    let hashedPassword = account.password;
    if (password) {
      hashedPassword = await this.passwordService.hashPassword(password);
    }

    let profileUrl = account.profilePict;
    if (profilePict) {
      if (
        account.profilePict !== null ||
        (account.profilePict !== "" && account.profilePict)
      ) {
        await this.fileService.remove(account.profilePict);
      }
      const { secure_url } = await this.fileService.upload(profilePict);
      profileUrl = secure_url;
    }
    let newAdminRole = account.Admin?.adminRole;
    if (adminRole) {
      newAdminRole = adminRole;
    }

    let result;
    if (email) {
      const existingEmail = await this.prisma.account.findUnique({
        where: { email },
      });

      if (existingEmail) {
        throw new ApiError("Email has been used", 409);
      }
      result = await this.prisma.$transaction(async (tx) => {
        const token = this.tokenService.generateToken(
          { id: account.id },
          env().JWT_SECRET_VERIFY!,
          { expiresIn: "1h" },
        );
        const verifyLink = `${env().BASE_URL_FE}/verify/${token}`;

        this.mailService.sendEmail(email, "Verify Account", "admin-verify", {
          fullName,
          email,
          verificationUrl: verifyLink,
          adminRole,
        });

        if (adminRole === "CASHIER") {
          await tx.admin.update({
            where: { accountId: account.id },
            data: { validToAnswerForum: false },
          });
        } else {
          await tx.admin.update({
            where: { accountId: account.id },
            data: { validToAnswerForum: true },
          });
        }

        return await tx.account.update({
          where: { id: account.id },
          data: {
            fullName: newFullName,
            password: hashedPassword,
            profilePict: profileUrl,
            isVerified: false,
            verifyToken: token,
          },
          select: prismaExclude("Account", ["password"]),
        });
      });
    } else if (!email) {
      result = await this.prisma.$transaction(async (tx) => {
        if (adminRole === "CASHIER") {
          await tx.admin.update({
            where: { accountId: account.id },
            data: { validToAnswerForum: false },
          });
        } else {
          await tx.admin.update({
            where: { accountId: account.id },
            data: { validToAnswerForum: true },
          });
        }

        return await tx.account.update({
          where: { id: account.id },
          data: {
            fullName: newFullName,
            password: hashedPassword,
            profilePict: profileUrl,
          },
          select: prismaExclude("Account", ["password"]),
        });
      });
    }
    return result;
  };
}
