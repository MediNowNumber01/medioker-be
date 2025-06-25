import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { GeocodingService } from "./geocoding.service";

@injectable()
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  public searchLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string;
      const result = await this.geocodingService.search(query);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  public reverseGeocode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { lat, lon } = req.query;
      const result = await this.geocodingService.reverse(lat as string, lon as string);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
}