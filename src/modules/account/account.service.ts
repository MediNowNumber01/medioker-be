import { Prisma } from "@prisma/client";
import { injectable } from "tsyringe";
import { env } from "../../config";
import { ApiError } from "../../utils/api-error";
import { PasswordService } from "../auth/password.service";
import { TokenService } from "../auth/token.service";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { prismaExclude } from "../prisma/utils";
import { GetAccountsDTO } from "./dto/get-accounts.dto";
import { UpdateAccountDTO } from "./dto/update-account.dto";
import { PaginationService } from "../pagination/pagination.service";

@injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly fileService: CloudinaryService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly paginationService: PaginationService,
  ) {}
  getSuperAdmin = async (authUserId: string) => {
    const account = await this.prisma.account.findUnique({
      where: { id: authUserId },
      select: prismaExclude("Account", ["password"]),
    });

    if (!account) {
      throw new ApiError("Accounts not found", 400);
    }

    return account;
  };

  getUser = async (authUserId: string) => {
    const account = await this.prisma.account.findUnique({
      where: { id: authUserId },
      select: prismaExclude("Account", ["password"]),
    });

    if (!account) {
      throw new ApiError("Accounts not found", 400);
    }

    return account;
  };

  getAllAccount = async (query: GetAccountsDTO) => {
    const { page, sortBy, sortOrder, take, search, isVerified, role, all } =
      query;

    let whereClause: Prisma.AccountWhereInput = {
      deletedAt: null,
      NOT: { role: "SUPER_ADMIN" },
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(isVerified !== undefined &&
        isVerified !== "all" && {
          isVerified: isVerified === "true",
        }),
      ...(role && {
        role: role,
      }),
    };

    let orderBy: Prisma.AccountOrderByWithRelationInput = {};
    if (sortBy === "fullName" || sortBy === "email" || sortBy === "createdAt") {
      orderBy = {
        [sortBy]: sortOrder,
      };
    } else if (sortBy) {
      orderBy = {
        [sortBy]: sortOrder,
      };
    } else {
      orderBy = {
        createdAt: "desc",
      };
    }
    let paginationArgs: Prisma.AccountFindManyArgs = {};
    if (!all) {
      paginationArgs = {
        skip: (page - 1) * take,
        take,
      };
    }

    const result = await this.prisma.account.findMany({
      where: whereClause,
      orderBy,
      ...paginationArgs,
      select: prismaExclude("Account", ["password"]),
    });

    if (!result) {
      throw new ApiError("Accounts not found", 400);
    }

    const countAdmin = await this.prisma.account.count({
      where: { role: "ADMIN" },
    });
    const countVerified = await this.prisma.account.count({
      where: {
        isVerified: true,
        NOT: { role: "SUPER_ADMIN" },
        deletedAt: null,
      },
    });
    const countUser = await this.prisma.account.count({
      where: { role: "USER", deletedAt: null },
    });
    const count = await this.prisma.account.count({ where: whereClause });

    return {
      data: result,
      countAdmin,
      countVerified,
      countUser,
      meta: this.paginationService.generateMeta({
        page,
        take: all ? count : take,
        count,
      }),
    };
  };

  public getUsers = async (query: GetAccountsDTO) => {
    const { page, sortBy, sortOrder, take, search, isVerified, provider, all } =
      query;

    const whereClause: Prisma.UserWhereInput = {
      account: {
        role: "USER",
        deletedAt: null,
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(isVerified !== undefined &&
          isVerified !== "all" && {
            isVerified: isVerified === "true",
          }),
        ...(provider && {
          provider: provider,
        }),
      },
    };

    let orderBy: Prisma.UserOrderByWithRelationInput = {};
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

    let paginationArgs: Prisma.UserFindManyArgs = {};
    if (!all) {
      paginationArgs = {
        skip: (page - 1) * take,
        take,
      };
    }
    const result = await this.prisma.user.findMany({
      where: whereClause,
      orderBy,
      ...paginationArgs,
      include: { account: { select: prismaExclude("Account", ["password"]) } },
    });

    const count = await this.prisma.user.count({ where: whereClause });
    const countGoogle = await this.prisma.account.count({
      where: { role: "USER", provider: "GOOGLE", deletedAt: null },
    });
    const countCredential = await this.prisma.account.count({
      where: { role: "USER", provider: "CREDENTIAL", deletedAt: null },
    });
    const countVerified = await this.prisma.account.count({
      where: { role: "USER", isVerified: true, deletedAt: null },
    });

    return {
      data: result,
      countGoogle,
      countCredential,
      countVerified,
      meta: this.paginationService.generateMeta({
        page,
        take: all ? count : take,
        count,
      }),
    };
  };

  deleteProfilePict = async (authUserId: string) => {
    const account = await this.prisma.account.findUnique({
      where: { id: authUserId },
    });

    if (!account) {
      throw new ApiError("account doesn't exist", 400);
    }

    await this.prisma.account.update({
      where: { id: authUserId },
      data: { profilePict: null },
      select: prismaExclude("Account", ["password"]),
    });

    return { message: "Delete profile picture success" };
  };

  updateAccount = async (
    body: UpdateAccountDTO,
    authUserId: string,
    profilePict?: Express.Multer.File,
  ) => {
    const { email, password, fullName } = body;

    const account = await this.prisma.account.findUnique({
      where: { id: authUserId },
    });

    if (!account) {
      throw new ApiError("account doesn't exist", 400);
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
      const { secure_url } = await this.fileService.upload(profilePict);
      profileUrl = secure_url;
    }

    let result;
    if (email && email !== account.email) {
      const uniqueEmail = await this.prisma.account.findUnique({
        where: { email },
      });

      if (uniqueEmail) {
        throw new ApiError("Email has been used", 409);
      }

      result = await this.prisma.$transaction(async (tx) => {
        const token = this.tokenService.generateToken(
          { id: account.id },
          env().JWT_SECRET_VERIFY!,
          { expiresIn: "1h" },
        );
        const verifyLink = `${env().BASE_URL_FE}/verify/${token}`;

        this.mailService.sendEmail(email, "Verify Account", "verify-account", {
          fullName,
          email,
          verificationUrl: verifyLink,
        });

        return await tx.account.update({
          where: { id: account.id },
          data: {
            fullName: newFullName,
            password: hashedPassword,
            profilePict: profileUrl,
            email,
            isVerified: false,
            verifyToken: token,
          },
          select: prismaExclude("Account", ["password"]),
        });
      });
    } else if (!email) {
      return await this.prisma.account.update({
        where: { id: account.id },
        data: {
          fullName: newFullName,
          password: hashedPassword,
          profilePict: profileUrl,
        },
        select: prismaExclude("Account", ["password"]),
      });
    }
    if (!result) {
      throw new ApiError("Failed to update account", 409);
    }

    const newAccessToken = this.tokenService.generateToken(
      {
        id: result.id,
        role: result.role,
        isVerified: result.isVerified,
      },
      env().JWT_SECRET,
    );

    return { result, newAccessToken };
  };

  deleteUser = async (accountId: string) => {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId, deletedAt: null },
    });

    if (!account) {
      throw new ApiError("Account doesn't exist", 400);
    }

    await this.fileService.remove(account.profilePict!);

    await this.prisma.account.update({
      where: { id: accountId },
      data: { deletedAt: new Date(), profilePict: "" },
    });

    return { message: "Delete user success." };
  };
}
