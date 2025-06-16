import { plainToInstance } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { CreatePharmacyDTO } from "./dto/create-pharmacy.dto";
import { GetPharmaciesDTO } from "./dto/get-pharmacies.dto";
import { UpdatePharmacyDTO } from "./dto/update-pharmacy.dto";
import { PharmacyService } from "./pharmacy.service";
import { ApiError } from "../../utils/api-error";
import { assignAdminPharmacyDTO } from "./dto/assignAdminPharmacy.dto";
import { VerifyNamePharmacyDTO } from "./dto/verify-name.dto";

@injectable()
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  public createPharmacy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const file = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      if (!file.picture) {
        throw new ApiError("Picture file is required", 400);
      }
      const body = req.body as CreatePharmacyDTO;
      const result = await this.pharmacyService.createPharmacy(
        body,
        file.picture[0],
      );
      res.status(201).send(result);
    } catch (error) {
      next(error);
    }
  };

  public verifyPharmacyName = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await this.pharmacyService.verifyPharmacyName(
        req.body as VerifyNamePharmacyDTO,
      );
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public assignAdminPharmacy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const body = req.body as assignAdminPharmacyDTO;
      const result = await this.pharmacyService.assignAdminPharmacy(body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public unassignAdminPharmacy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const adminId = req.params.adminId;
      const result = await this.pharmacyService.unassignAdminPharmacy(adminId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public getAssignedAdmins = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const pharmacyId = req.params.pharmacyId;
      const result = await this.pharmacyService.getAssignedAdmins(pharmacyId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public getDashboardPharmacies = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await this.pharmacyService.getDashboardPharmacies();
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public getPharmacies = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const query = plainToInstance(GetPharmaciesDTO, req.query);
      const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
      const result = await this.pharmacyService.getPharmacies(
        query,
        isSuperAdmin,
      );
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public getPharmacy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const isSuperAdmin = req.user?.role === "SUPER_ADMIN";
      const result = await this.pharmacyService.getPharmacy(id, isSuperAdmin);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public updatePharmacy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const pictureFile = req.file;
      const body = req.body as UpdatePharmacyDTO;
      const result = await this.pharmacyService.updatePharmacy(
        id,
        body,
        pictureFile,
      );
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public deletePharmacy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.params;
      const result = await this.pharmacyService.deletePharmacy(id);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
}
