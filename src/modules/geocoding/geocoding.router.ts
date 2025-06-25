import { Router } from "express";
import { autoInjectable } from "tsyringe";
import { GeocodingController } from "./geocoding.controller";

@autoInjectable()
export class GeocodingRouter {
  private readonly router: Router = Router();

  constructor(private readonly geocodingController: GeocodingController) {
    this.initializeRoutes();
  }

  private initializeRoutes = (): void => {
    this.router.get("/search", this.geocodingController.searchLocation);
    this.router.get("/reverse", this.geocodingController.reverseGeocode);
  };

  public getRouter(): Router {
    return this.router;
  }
}