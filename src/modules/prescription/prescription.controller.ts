import { plainToInstance } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { ApiError } from "../../utils/api-error";
import { PrescriptionService } from "./prescription.service";
import { CreatePrescriptionOrderDTO } from "./dto/prescription.dto";

@injectable()
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  public getPharmacies = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { lat, lon } = req.params;
      const latitude = lat ? parseFloat(lat as string) : undefined;
      const longitude = lon ? parseFloat(lon as string) : undefined;

      const result =
        await this.prescriptionService.getPharmaciesForPrescription(
          latitude,
          longitude,
        );
      res.status(200).send({
        message: "Daftar apotek berhasil diambil",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public createPrescriptionOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError("User not authenticated", 401);
      }

      if(!req.user?.isVerified === true) {
        throw new ApiError("User not verified", 401);
      }
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const prescriptionFiles = files.prescriptions;
      if (!prescriptionFiles || prescriptionFiles.length === 0) {
        throw new ApiError("Minimal satu file resep wajib diunggah", 400);
      }

      const body = plainToInstance(CreatePrescriptionOrderDTO, req.body);

      const result = await this.prescriptionService.createPrescriptionOrder(
        userId,
        body,
        prescriptionFiles,
      );
      res.status(201).send(result);
    } catch (error) {
      next(error);
    }
  };
}
