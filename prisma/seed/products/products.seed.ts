import { PrismaClient } from "@prisma/client";
import { ProductInfoSeed } from "./productInfo.seed";
import { ProductImagesSeed } from "./productImage.seed";
import { ProductUnitsSeed } from "./productUnit.seed";

export const productSeed = async (prisma: PrismaClient) => {
  await ProductInfoSeed(prisma);
  await ProductImagesSeed(prisma);
  await ProductUnitsSeed(prisma);
  console.log("Products seeded successfully");
};
