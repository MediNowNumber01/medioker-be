import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { env } from "../../config";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { verifyRole } from "../../middleware/role.middleware";
import { fileFilter, uploader } from "../../middleware/uploader.middleware";
import { StrictValidateBody } from "../../middleware/validation.middleware";
import { assignEmployeePharmacyDTO } from "./dto/assignEmployeePharmacy.dto";
import { CreatePharmacyDTO } from "./dto/create-pharmacy.dto";
import { UpdatePharmacyDTO } from "./dto/update-pharmacy.dto";
import { PharmacyController } from "./pharmacy.controller";

@autoInjectable()
export class PharmacyRouter {
  private readonly router: Router = Router();

  constructor(
    private readonly jwtMiddleware: JwtMiddleware,
    private readonly pharmacyController: PharmacyController,
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes = (): void => {
    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      uploader().fields([{ name: "picture", maxCount: 1 }]),
      fileFilter,
      StrictValidateBody(CreatePharmacyDTO),
      this.pharmacyController.createPharmacy,
    );

    this.router.post(
      "/employee",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      StrictValidateBody(assignEmployeePharmacyDTO),
      this.pharmacyController.assignEmployeePharmacy,
    );

    this.router.get(
      "/",
      this.jwtMiddleware.verifyTokenNoThrow(env().JWT_SECRET),
      this.pharmacyController.getPharmacies,
    );
    this.router.get(
      "/dashboard",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.pharmacyController.getDashboardPharmacies,
    );
    this.router.get(
      "/verify-name",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.pharmacyController.verifyPharmacyName,
    );
    this.router.get(
      "/employee/:pharmacyId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.pharmacyController.getAssignedEmployees,
    );

    this.router.get(
      "/:id",
      this.jwtMiddleware.verifyTokenNoThrow(env().JWT_SECRET),
      this.pharmacyController.getPharmacy,
    );

    this.router.patch(
      "/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      uploader().single("picture"),
      fileFilter,
      StrictValidateBody(UpdatePharmacyDTO),
      this.pharmacyController.updatePharmacy,
    );

    this.router.delete(
      "/employee/:employeeId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.pharmacyController.unassignEmployeePharmacy,
    );

    this.router.delete(
      "/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.pharmacyController.deletePharmacy,
    );
  };

  public getRouter(): Router {
    return this.router;
  }
}
