import { plainToInstance } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { CreatePharmacyDTO } from "./dto/create-pharmacy.dto";
import { GetPharmaciesDTO } from "./dto/get-pharmacies.dto";
import { UpdatePharmacyDTO } from "./dto/update-pharmacy.dto";
import { PharmacyService } from "./pharmacy.service";

@injectable()
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  createPharmacy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pictureFile = req.file;
      const body = plainToInstance(CreatePharmacyDTO, req.body);
      const result = await this.pharmacyService.createPharmacy(
        body,
        pictureFile,
      );
      res.status(201).send(result);
    } catch (error) {
      next(error);
    }
  };

  getPharmacies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = plainToInstance(GetPharmaciesDTO, req.query);
      const result = await this.pharmacyService.getPharmacies(query);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  getPharmacy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.pharmacyService.getPharmacy(id);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  updatePharmacy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const pictureFile = req.file;
      const body = plainToInstance(UpdatePharmacyDTO, req.body);
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

  deletePharmacy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.pharmacyService.deletePharmacy(id);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
}
