import { Pharmacy, UserAddresses } from "@prisma/client";
import { injectable } from "tsyringe";
import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PrismaService } from "../prisma/prisma.service";
import { AddAddressDTO } from "./dto/add-address.dto";

@injectable()
export class AddressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: CloudinaryService,
  ) {}

  public async getUserAddress(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { User: { select: { id: true } } },
    });

    if (!account) {
      throw new ApiError("user not found", 400);
    }

    const userAddresses = await this.prisma.userAddresses.findMany({
      where: { userId: account.User!.id },
      orderBy: { isPrimary: "desc" },
    });

    return userAddresses;
  }

  public async addAddress(accountId: string, body: AddAddressDTO) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { User: { select: { id: true } } },
    });
    if (!account) {
      throw new ApiError("user not found", 400);
    }

    const newAddress = this.prisma.$transaction(async (tx) => {
      const addressCount = await tx.userAddresses.count({
        where: { deletedAt: null, userId: account.User!.id },
      });
      if (addressCount === 0) {
        body.isPrimary = true;
      } else if (body.isPrimary) {
        await tx.userAddresses.updateMany({
          where: { isPrimary: true, userId: account.User?.id },
          data: { isPrimary: false },
        });
      }
     return await tx.userAddresses.create({
        data: { ...body, userId: account.User!.id, isPrimary: body.isPrimary},
      });
    });

    return newAddress;
  }

  public async setPrimary(addressId: string, accountId: string) {
    const address = await this.prisma.userAddresses.findUnique({
      where: { id: addressId },
    });

    console.log("address", address);

    if (!address) {
      throw new ApiError("address not found", 400);
    }
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { User: { select: { id: true } } },
    });

    if (!account) {
      throw new ApiError("account not found", 400);
    }

    console.log("acc", account);

    await this.prisma.userAddresses.updateMany({
      where: { userId: account.User?.id, isPrimary: true },
      data: { isPrimary: false },
    });

    return await this.prisma.userAddresses.update({
      where: { id: addressId },
      data: {
        isPrimary: true,
      },
    });
  }
}
