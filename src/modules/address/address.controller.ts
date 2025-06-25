import { NextFunction, Request, Response } from "express";
import { injectable } from "tsyringe";
import { AddressService } from "./address.service";
import { TokenService } from "../auth/token.service";
import { ApiError } from "../../utils/api-error";
import { AddAddressDTO } from "./dto/add-address.dto";

@injectable()
export class AddressController {
  constructor(
    private readonly addressService: AddressService,
    private readonly tokenService: TokenService,
  ) {}

  getUserAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.user?.id;
      if (!accountId) {
        throw new ApiError("User not authenticated", 401);
      }
      const result = await this.addressService.getUserAddress(accountId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };

  setPrimary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.user?.id;
      if (!accountId) {
        throw new ApiError("User not authenticated", 401);
      }

      const { addressId } = req.params;
      const result = await this.addressService.setPrimary(addressId, accountId);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
  addAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.user?.id;
      if (!accountId) {
        throw new ApiError("User not authenticated", 401);
      }

      const body = req.body as AddAddressDTO;
      const result = await this.addressService.addAddress(accountId, body);
      res.status(200).send(result);
    } catch (error) {
      next(error);
    }
  };
}
