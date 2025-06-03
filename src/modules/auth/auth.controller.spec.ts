import { NextFunction, Request, Response } from "express";
import { mockUserData } from "../../../test/integration/user/utils";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let authController: AuthController;
  let authServiceMock: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    authServiceMock = {
      login: jest.fn(),
      register: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    authController = new AuthController(authServiceMock);

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("login", () => {
    it("should return 200 and the registration result on success", async () => {
      const [mockUser] = mockUserData({ numberOfUsers: 1 });
      const { email, password } = mockUser;
      const mockReqBody = { email, password }; // tambahkan fullName
      const mockLoginResult = {
        ...mockUser,
        accessToken: "mockAccessToken",
      };

      mockRequest.body = mockReqBody;
      authServiceMock.login.mockResolvedValue(mockLoginResult);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(authServiceMock.login).toHaveBeenCalledWith(mockReqBody);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockLoginResult);
    });

    it("should call next with error on failure", async () => {
      // Arrange
      const mockError = new Error();
      authServiceMock.login.mockRejectedValue(mockError);
      mockRequest.body = {
        email: "test@example.com",
        password: "wrongPassword",
      };

      // Act
      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      // Assert
      expect(authServiceMock.login).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  // describe("register", () => {
  //   it("should return 200 and the registration result on success", async () => {
  //     const [mockUser] = mockUserData({ numberOfUsers: 1 });

  //     // Pastikan mockUser memiliki properti fullName
  //     const { fullName, email, password } = mockUser;

  //     const mockReqBody = { fullName, email, password }; // Pastikan fullName tersedia
  //     const mockRegisterResult = mockUser;

  //     mockRequest.body = mockReqBody;
  //     authServiceMock.register.mockResolvedValue(mockRegisterResult);

  //     await authController.register(
  //       mockRequest as Request,
  //       mockResponse as Response,
  //       mockNext,
  //     );

  //     expect(authServiceMock.register).toHaveBeenCalledWith(mockReqBody);
  //     expect(mockResponse.status).toHaveBeenCalledWith(200);
  //     expect(mockResponse.send).toHaveBeenCalledWith(mockRegisterResult);
  //   });

  //   it("should call next with error on failure", async () => {
  //     const mockError = new Error();
  //     authServiceMock.register.mockRejectedValue(mockError);
  //     mockRequest.body = {
  //       email: "test@example.com",
  //       password: "password123",
  //       fullName: "Test User",
  //     };

  //     await authController.register(
  //       mockRequest as Request,
  //       mockResponse as Response,
  //       mockNext,
  //     );

  //     expect(authServiceMock.register).toHaveBeenCalled();
  //     expect(mockNext).toHaveBeenCalledWith(mockError);
  //   });
  // });
});
