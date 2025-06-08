import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { env } from "../../config";
import { JwtMiddleware } from "../../middleware/jwt.middleware";
import { fileFilter, uploader } from "../../middleware/uploader.middleware";
import { verifyRole } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
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
      uploader().single("picture"),
      fileFilter,
      validateBody(CreatePharmacyDTO),
      this.pharmacyController.createPharmacy,
    );

    this.router.get("/", this.pharmacyController.getPharmacies);

    this.router.get("/:id", this.pharmacyController.getPharmacy);

    this.router.put(
      "/:id",
      this.jwtMiddleware.verifyToken(env().JWT_SECRET),
      verifyRole(["SUPER_ADMIN"]),
      uploader().single("picture"),
      fileFilter,
      validateBody(UpdatePharmacyDTO),
      this.pharmacyController.updatePharmacy,
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
