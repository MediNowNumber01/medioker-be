import axios from "axios";
import { injectable } from "tsyringe";
import { env } from "../../config";
import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { prismaExclude } from "../prisma/utils";
import { forgotPasswordDTO } from "./dto/forgot-password.dto";
import { LoginDTO } from "./dto/login.dto";
import { RegisterDTO } from "./dto/register.dto";
import { ResetPasswordDTO } from "./dto/reset-password.dto";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

@injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly fileService: CloudinaryService,
    private readonly mailService: MailService,
  ) {}

  login = async (body: LoginDTO) => {
    const { email, password } = body;

    const account = await this.prisma.account.findFirst({
      where: { email },
    });

    if (!account) {
      throw new ApiError("User not found", 404);
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      account.password!,
    );

    if (!isPasswordValid) {
      throw new ApiError("Invalid credentials", 400);
    }

    const accessToken = this.tokenService.generateToken(
      {
        id: account.id,
        role: account.role,
        isVerified: account.isVerified
      },
      env().JWT_SECRET,
    );

    const { password: pw, ...accountWithoutPassword } = account;
console.log(accessToken);

    return { ...accountWithoutPassword, accessToken };
  };

  verify = async (token: string) => {
    let decoded;
    try {
      decoded = await this.tokenService.verifyToken(
        token,
        env().JWT_SECRET_FORGOT_PASSWORD!,
      );
    } catch (error) {
      throw new ApiError("Invalid or expired token", 400);
    }

    const { id: accountId } = decoded;

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new ApiError("Account not found", 404);
    }

    if (account.isVerified) {
      throw new ApiError("Account already verified", 400);
    }

    const updatedAccount = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        isVerified: true,
      },
      select: prismaExclude("Account", ["password"]),
    });

    return updatedAccount;
  };

  register = async (body: RegisterDTO, profilePict?: Express.Multer.File) => {
    const { email, password, fullName } = body;

    const exsistingAccount = await this.prisma.account.findFirst({
      where: { email },
    });

    if (exsistingAccount) {
      throw new ApiError("Email already exist", 400);
    }

    const hashedPassword = await this.passwordService.hashPassword(password);

    let profileUrl: string | undefined;

    if (profilePict) {
      const { secure_url } = await this.fileService.upload(profilePict);
      profileUrl = secure_url;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let newAcc;

      newAcc = await tx.account.create({
        data: {
          fullName,
          email,
          password: hashedPassword,
          profilePict: profileUrl,
        },
        select: prismaExclude("Account", ["password"]),
      });

      const token = this.tokenService.generateToken(
        { id: newAcc.id },
        env().JWT_SECRET_FORGOT_PASSWORD!,
        { expiresIn: "1h" },
      );

      const verifyLink = `${env().BASE_URL_FE}/reset-password/${token}`

      this.mailService.sendEmail(email, "Verify Account", "verify-account", {
        fullName,
        email,
        verificationUrl: verifyLink,
      });

      console.log(token);

      await tx.user.create({
        data: {
          accountId: newAcc.id,
        },
      });

      return newAcc;
    });

    return result;
  };

  resetPassword = async (body: ResetPasswordDTO, authUserId: string) => {

    const user = await this.prisma.account.findFirst({
      where: { id: authUserId },
    });

    if (!user) {
      throw new ApiError("Invalid credentials", 400);
    }

    const hashedPassword = await this.passwordService.hashPassword(
      body.password,
    );

    await this.prisma.account.update({
      where: { id: authUserId },
      data: { password: hashedPassword },
    });

    return { message: "Reset password success" };
  };

  forgotPassword = async (body: forgotPasswordDTO) => {
    const { email } = body;

    const account = await this.prisma.account.findFirst({
      where: { email },
      omit: { password: true },
    });

    if (!account) {
      throw new ApiError("Invalid credentials", 400);
    }

    const token = this.tokenService.generateToken(
      { id: account.id },
      env().JWT_SECRET_FORGOT_PASSWORD!,
      { expiresIn: "1h" },
    );

    console.log(token);

    const link = `${env().BASE_URL_FE!}/reset-password/${token}`;

    this.mailService.sendEmail(email, "Link reset password", "reset-password", {
      fullName: account.fullName,
      resetLink: link,
      expiryTime: 1,
    });

    return { message: "Send email success" };
  };

  googleLogin = async (token: string) => {
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const payload = response.data;
    if (!payload.email) throw new ApiError("Invalid google email", 400);

    let account = await this.prisma.account.findUnique({
      where: { email: payload.email },
    });

    if (!account) {
      await this.prisma.$transaction(async (tx) => {
        account = await tx.account.create({
          data: {
            email: payload.email,
            profilePict: payload.picture,
            fullName: payload.name,
            isVerified: true,
            role: "USER",
          },
        });

        await tx.user.create({
          data: {
            accountId: account.id,
          },
        });
      });
    }

    if (!account) {
      throw new ApiError("Gagal membuat akun", 500);
    }

    const { password: pw, ...accountWithoutPassword } = account;

    const accessToken = this.tokenService.generateToken(
      {
        id: account.id,
        role: account.role,
        profilePict: account.profilePict,
        isVerified: account.isVerified
      },
      env().JWT_SECRET,
      { expiresIn: "48h" },
    );

    return { ...accountWithoutPassword, accessToken };
  };

}


