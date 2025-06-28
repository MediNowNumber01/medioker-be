import { plainToInstance } from "class-transformer";
import { AdminService } from "./admin.service";
import { GetAdminsDTO } from "./dto/get-admins.dto";
import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { UpdateAdminDTO } from "./dto/update-admin.dto";
import { CreateAdminDTO } from "./dto/create-admin.dto";
import { ApiError } from "../../utils/api-error";

@injectable()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  public getAdmins = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const query = plainToInstance(GetAdminsDTO, req.query);
      const result = await this.adminService.getAdmins(query);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  createAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as CreateAdminDTO;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const profilePict = files.profilePict?.[0];
      if (!profilePict) throw new ApiError("Profile Picture is required", 400);
      const result = await this.adminService.createAdmin(body, profilePict);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  deleteAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("nyampe");
      
      const { accountId } = req.params;
      const result = await this.adminService.deleteAdmin(accountId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  updateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const profilePict = files.profilePict?.[0];
      const body = req.body as UpdateAdminDTO;
      const { accountId } = req.params;
      const result = await this.adminService.updateAdmin(
        accountId,
        body,
        profilePict,
      );
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public getAdminDetail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const result = await this.adminService.getAdminDetail(id);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
}
