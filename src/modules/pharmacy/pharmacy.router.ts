import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { env } from "../../config";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { verifyRole } from "../../middleware/role.middleware";
import { fileFilter, uploader } from "../../middleware/uploader.middleware";
import { StrictValidateBody } from "../../middleware/validation.middleware";
import { assignAdminPharmacyDTO } from "./dto/assignAdminPharmacy.dto";
import { CreatePharmacyDTO } from "./dto/create-pharmacy.dto";
import { UpdatePharmacyDTO } from "./dto/update-pharmacy.dto";
import { VerifyNamePharmacyDTO } from "./dto/verify-name.dto";
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
      "/verify-name",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      StrictValidateBody(VerifyNamePharmacyDTO),
      this.pharmacyController.verifyPharmacyName,
    );
    this.router.post(
      "/admin",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      StrictValidateBody(assignAdminPharmacyDTO),
      this.pharmacyController.assignAdminPharmacy,
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
      "/admin/:pharmacyId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.pharmacyController.getAssignedAdmins,
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
      "/admin/:adminId",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      this.pharmacyController.unassignAdminPharmacy,
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
