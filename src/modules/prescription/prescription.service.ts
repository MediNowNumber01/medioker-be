import { Pharmacy, Prisma, UserAddresses } from "@prisma/client";
import { injectable } from "tsyringe";
import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreatePrescriptionOrderDTO,
  PrescriptionOrderType,
} from "./dto/prescription.dto";
import { Status } from "../../types/status";

@injectable()
export class PrescriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: CloudinaryService,
  ) {}

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public async getPharmaciesForPrescription(
    userLatitude?: number,
    userLongitude?: number,
  ) {
    const openPharmacies = await this.prisma.pharmacy.findMany({
      where: {
        isOpen: true,
        deletedAt: null,
      },
    });

    if (!userLatitude || !userLongitude) {
      return openPharmacies;
    }

    const pharmaciesWithDistance = openPharmacies.map((pharmacy) => ({
      ...pharmacy,
      distance: this.calculateDistance(
        userLatitude,
        userLongitude,
        parseFloat(pharmacy.lat),
        parseFloat(pharmacy.lng),
      ),
    }));

    const nearbyPharmacies = pharmaciesWithDistance
      .filter((p) => p.distance <= 10)
      .sort((a, b) => a.distance - b.distance);

    const farPharmacies = pharmaciesWithDistance
      .filter((p) => p.distance > 10)
      .sort((a, b) => a.name.localeCompare(b.name));

    return [...nearbyPharmacies, ...farPharmacies];
  }

  public async createPrescriptionOrder(
    accountId: string,
    dto: CreatePrescriptionOrderDTO,
    prescriptionFiles: Express.Multer.File[],
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new ApiError("Akun tidak ditemukan", 404);

    const user = await this.prisma.user.findUnique({
      where: { accountId: accountId },
    });
    if (!user) throw new ApiError("Data user tidak ditemukan", 404);

    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: dto.pharmacyId },
    });
    if (!pharmacy) throw new ApiError("Apotek tidak ditemukan", 404);

    const order = await this.prisma.$transaction(async (tx) => {
      const uploadPromises = prescriptionFiles.map((file) =>
        this.fileService.upload(file),
      );
      const uploadResults = await Promise.all(uploadPromises);
      const prescriptionUrls = uploadResults.map((result) => result.secure_url);

      let deliveryPrice = 0;
      let deliveryDetails: UserAddresses | null = null;
      let pickupCode: string | undefined = undefined;

      let orderStatus: Status = Status.RECIPT_CONFIRMATION;
      if (dto.orderType === PrescriptionOrderType.DELIVERY) {
        if (!dto.userAddressId) {
          throw new ApiError(
            "Alamat pengguna wajib diisi untuk pengiriman",
            400,
          );
        }
        deliveryDetails = await tx.userAddresses.findFirst({
          where: { id: dto.userAddressId, userId: user.id },
        });
        if (!deliveryDetails)
          throw new ApiError(
            "Alamat pengguna tidak valid atau bukan milik Anda",
            404,
          );

        const distance = this.calculateDistance(
          parseFloat(pharmacy.lat),
          parseFloat(pharmacy.lng),
          parseFloat(deliveryDetails.latitude),
          parseFloat(deliveryDetails.longitude),
        );
        deliveryPrice = Math.round(distance * 1000);
      } else if (dto.orderType === PrescriptionOrderType.PICKUP) {
        pickupCode = `MDNW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        orderStatus = Status.RECIPT_CONFIRMATION;
      }

      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          pharmacyId: dto.pharmacyId,
          status: orderStatus,
          orderType: "PRESCRIPTION",
          note: dto.note,
          productPrice: "0",
          deliveryPrice: deliveryPrice,
          totalPrice: deliveryPrice,
          pickupCode: pickupCode,
        },
      });

      await tx.prescription.createMany({
        data: prescriptionUrls.map((url) => ({
          orderId: newOrder.id,
          source: url,
        })),
      });

      if (dto.orderType === PrescriptionOrderType.DELIVERY && deliveryDetails) {
        await tx.delivery.create({
          data: {
            orderId: newOrder.id,
            name: account.fullName,
            fullAddress: deliveryDetails.fullAddress,
            postalCode: deliveryDetails.postalCode,
            latitude: deliveryDetails.latitude,
            longitude: deliveryDetails.longitude,
            expedition: "",
            deliveryFee: deliveryPrice,
          },
        });
      }

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: { Prescription: true, Delivery: true },
      });
    });

    return {
      message:
        "Pesanan resep berhasil dibuat dan sedang menunggu konfirmasi apotek.",
      data: order,
    };
  }
}
