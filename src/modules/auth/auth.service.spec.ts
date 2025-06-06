import { Context, createMockContext, MockContext } from "../../../test/context";
import { mockUserData } from "../../../test/integration/user/utils";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { MailService } from "../mail/mail.service";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

describe("SampleService", () => {
  let mockCtx: MockContext;
  let ctx: Context;
  let passwordService: PasswordService;
  let tokenService: TokenService;
  let fileService: CloudinaryService;
  let authService: AuthService;
  let mailService: MailService;

  beforeEach(() => {
    mockCtx = createMockContext();
    ctx = mockCtx as unknown as Context;
    passwordService = new PasswordService();
    tokenService = new TokenService();
    fileService = new CloudinaryService();
    mailService = new MailService();
    authService = new AuthService(
      ctx.prisma,
      passwordService,
      tokenService,
      fileService,
      mailService,
    );
  });

  describe("login", () => {
    it("should return user data with access token", async () => {
      const numberOfUsers = 1;
      const [user] = mockUserData({ numberOfUsers });

      mockCtx.prisma.account.findFirst.mockResolvedValueOnce(user);

      jest.spyOn(passwordService, "comparePassword").mockResolvedValue(true);
      jest.spyOn(tokenService, "generateToken").mockReturnValue("mAccessToken");

      const body = { email: user.email, password: "CorrectPassword" };
      const result = await authService.login(body);

      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.accessToken).toBeDefined();
      expect(result).not.toHaveProperty("password");
    });

    it("should throw an error if the user is not found", async () => {
      mockCtx.prisma.account.findFirst.mockResolvedValueOnce(null);

      const body = {
        email: "nonexistent@example.com",
        password: "WrongPassword",
      };

      expect(authService.login(body)).rejects.toThrow("User not found");
    });

    it("should throw an error if the password is incorrect", async () => {
      const numberOfUsers = 1;
      const [user] = mockUserData({ numberOfUsers });

      mockCtx.prisma.account.findFirst.mockResolvedValueOnce(user);
      jest.spyOn(passwordService, "comparePassword").mockResolvedValue(false);

      const body = { email: user.email, password: "WrongPassword" };

      expect(authService.login(body)).rejects.toThrow("Invalid credentials");
    });
  });
  // describe("register", () => {
  //   it("should register user successfully", async () => {
  //     const numberOfUsers = 1;
  //     const [user] = mockUserData({ numberOfUsers });

  //     // Pastikan user punya id, email, etc.
  //     mockCtx.prisma.account.findFirst.mockResolvedValueOnce(null);
  //     jest
  //       .spyOn(passwordService, "hashPassword")
  //       .mockResolvedValue("hashedPassword");

  //     // Pastikan prisma create mengembalikan user lengkap
  //     mockCtx.prisma.account.create.mockResolvedValueOnce({
  //       ...user,
  //       password: "hashedPassword",
  //     });

  //     const result = await authService.register({
  //       fullName: user.fullName,
  //       email: user.email,
  //       password: user.password,
  //     });

  //     expect(result).toBeDefined();
  //     expect(result.id).toBe(user.id); // harus ada id
  //     expect(result.email).toBe(user.email);
  //   });

  //   it("should throw an error if the email already exists", async () => {
  //     const numberOfUsers = 1;
  //     const [user] = mockUserData({ numberOfUsers });

  //     mockCtx.prisma.account.findFirst.mockResolvedValueOnce(user);

  //     const body = {
  //       fullName: user.fullName,
  //       email: user.email,
  //       password: "PlainPassword123",
  //     };

  //     expect(authService.register(body)).rejects.toThrow("Email already exist");
  //   });
  // });
});
