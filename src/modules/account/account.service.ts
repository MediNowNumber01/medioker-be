import { injectable } from "tsyringe";
import { env } from "../../config";
import { ApiError } from "../../utils/api-error";
import { TokenService } from "../auth/token.service";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateAccountDTO } from "./dto/update-account.dto";
import { PasswordService } from "../auth/password.service";
import { CreateAdminDTO } from "./dto/create-admin";
import { UpdateAdminDTO } from "./dto/update-admin";
import { prismaExclude } from "../prisma/utils";

@injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly fileService: CloudinaryService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
  ) {}

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
  getAllAccount = async () => {
    const account = await this.prisma.account.findMany({
      where: { deletedAt: null, NOT: { role: "SUPER_ADMIN" } },
      orderBy: { role: "desc" },
      select: prismaExclude("Account", ["password"]),
    });

    if (!account) {
      throw new ApiError("Accounts not found", 400);
    }

    return account;
  };

  getAdmin = async () => {
    const account = await this.prisma.account.findMany({
      where: { deletedAt: null, role: "ADMIN" },
    });

    if (!account) {
      throw new ApiError("Accounts not found", 400);
    }

    return account;
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
      throw new ApiError("Email is already exist", 400);
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
        const token = this.tokenService.generateToken(
          { id: accountId },
          env().JWT_SECRET_VERIFY!,
          { expiresIn: "1h" },
        );
        const verifyLink = `${env().BASE_URL_FE}/verify/${token}`;

        this.mailService.sendEmail(email, "Verify Account", "admin-verify", {
          fullName,
          email,
          adminRole,
          verificationUrl: verifyLink,
        });
        const newAdmin = await tx.account.create({
          data: {
            email,
            fullName,
            password: hashedPassword,
            profilePict: profileUrl,
            role: "ADMIN",
            verifyToken: token,
          },
          select: prismaExclude("Account", ["password"]),
        });

        await tx.admin.create({
          data: { adminRole, accountId: newAdmin.id, validToAnswerForum: true },
        });

        return newAdmin;
      });
    } else if (adminRole === "CASHIER") {
      return await this.prisma.$transaction(async (tx) => {
        const token = this.tokenService.generateToken(
          { id: accountId },
          env().JWT_SECRET_VERIFY!,
          { expiresIn: "1h" },
        );
        const verifyLink = `${env().BASE_URL_FE}/verify/${token}`;

        this.mailService.sendEmail(email, "Verify Account", "admin-verify", {
          fullName,
          email,
          adminRole,
          verificationUrl: verifyLink,
        });
        const newAdmin = await tx.account.create({
          data: {
            email,
            fullName,
            password: hashedPassword,
            profilePict: profileUrl,
            role: "ADMIN",
            verifyToken: token,
          },
          select: prismaExclude("Account", ["password"]),
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
    if (email && email === account.email) {
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
            isVerified: false,
            verifyToken: token,
          },
          select: prismaExclude("Account", ["password"]),
        });
      });
    } else if (!email) {
      result = await this.prisma.account.update({
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

  deleteAdmin = async (accountId: string) => {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new ApiError("Account not found", 400);
    }

    if (account.deletedAt !== null) {
      throw new ApiError(`Blog has been deleted at ${account.deletedAt}`, 404);
    }

    await this.fileService.remove(account.profilePict!);

    await this.prisma.account.update({
      where: { id: accountId },
      data: { deletedAt: new Date(), profilePict: "" },
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
      const { secure_url } = await this.fileService.upload(profilePict);
      profileUrl = secure_url;
    }
    // let newAdminRole = account.Admin?.adminRole;
    // if (adminRole) {
    //   newAdminRole = adminRole;
    // }

    let result;
    if (email) {
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
