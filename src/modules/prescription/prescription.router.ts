import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { env } from "../../config";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { verifyRole } from "../../middleware/role.middleware";
import { fileFilter, uploader } from "../../middleware/uploader.middleware";
import { StrictValidateBody } from "../../middleware/validation.middleware";
import { CreatePrescriptionOrderDTO } from "./dto/prescription.dto";
import { PrescriptionController } from "./prescription.controller";

@autoInjectable()
export class PrescriptionRouter {
  private readonly router: Router = Router();

  constructor(
    private readonly jwtMiddleware: JwtMiddleware,
    private readonly prescriptionController: PrescriptionController,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes = (): void => {
    this.router.get(
      "/pharmacies",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["USER"]),
      this.prescriptionController.getPharmacies,
    );
    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["USER"]),
      // verifyAccount([true]),
      uploader().fields([{ name: "prescriptions", maxCount: 5 }]),
      fileFilter,
      StrictValidateBody(CreatePrescriptionOrderDTO),
      this.prescriptionController.createPrescriptionOrder,
    );
  };

  public getRouter(): Router {
    return this.router;
  }
}
