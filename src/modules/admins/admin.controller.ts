import { plainToInstance } from "class-transformer";
import { AdminService } from "./admin.service";
import { GetAdminsDTO } from "./dto/get-admins.dto";
import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";

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
