import { plainToInstance } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { ApiError } from "../../utils/api-error";
import { AccountService } from "./account.service";
import { GetAccountsDTO } from "./dto/get-accounts.dto";
import { UpdateAccountDTO } from "./dto/update-account.dto";

@injectable()
export class accountController {
  constructor(private readonly accountService: AccountService) {}

  getSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }
      const result = await this.accountService.getSuperAdmin(userId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }
      const result = await this.accountService.getUser(userId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  deleteProfilePict = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }
      const result = await this.accountService.deleteProfilePict(userId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
  updateAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const profilePict = files.profilePict?.[0];
      const body = req.body as UpdateAccountDTO;
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      const result = await this.accountService.updateAccount(
        body,
        userId,
        profilePict,
      );
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  getAllAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = plainToInstance(GetAccountsDTO, req.query);
      const result = await this.accountService.getAllAccount(query);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = plainToInstance(GetAccountsDTO, req.query);
      const result = await this.accountService.getUsers(query);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accountId } = req.params;
      const result = await this.accountService.deleteUser(accountId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
}
