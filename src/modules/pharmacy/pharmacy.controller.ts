import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { ApiError } from "../../utils/api-error";
import { assignEmployeePharmacyDTO } from "./dto/assignEmployeePharmacy.dto";
import { CreatePharmacyDTO } from "./dto/create-pharmacy.dto";
import { GetPharmaciesDTO } from "./dto/get-pharmacies.dto";
import { UpdatePharmacyDTO } from "./dto/update-pharmacy.dto";
import { VerifyNamePharmacyDTO } from "./dto/verify-name.dto";
import { PharmacyService } from "./pharmacy.service";
import { GetPharmacyEmployeesDTO } from "./dto/get-pharmacy-employee.dto";

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
      const query = plainToInstance(VerifyNamePharmacyDTO, req.query);
      const error = await validate(query);
      if (error.length > 0) {
        throw new ApiError("Invalid query parameters", 400);
      }
      const result = await this.pharmacyService.verifyPharmacyName(
        query as VerifyNamePharmacyDTO,
      );
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public assignEmployeePharmacy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const body = req.body as assignEmployeePharmacyDTO;
      const result = await this.pharmacyService.assignEmployeePharmacy(body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public unassignEmployeePharmacy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const employeeId = req.params.employeeId;
      const result =
        await this.pharmacyService.unassignEmployeePharmacy(employeeId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public getAssignedEmployees = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const pharmacyId = req.params.pharmacyId;
      const query = plainToInstance(GetPharmacyEmployeesDTO, req.query);
      const result = await this.pharmacyService.getAssignedEmployees(
        pharmacyId,
        query,
      );
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
