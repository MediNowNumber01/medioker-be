import { PrismaClient } from "@prisma/client";

export const ProductUnitsSeed = async (prisma: PrismaClient) => {
  const startNumber = 31;
  const endNumber = 60;
  const data = await prisma.$transaction(async (tx) => {
    await Promise.all(
      Array.from({ length: endNumber - startNumber + 1 }, (_, idx) => {
        const i = startNumber + idx;
        // Create main unit
        const mainUnitPromise = tx.unitProduct.create({
          data: {
            productId: `${i}`,
            name: `cuilan`,
            price: 10000 + i * 1000,
            ratioToMain: 1,
            isMain: true,
            weight: 100 + i,
          },
        });
        // Create secondary unit
        const secondaryUnitPromise = tx.unitProduct.create({
          data: {
            productId: `${i}`,
            name: `glondong`,
            price: 5000 + i * 500,
            ratioToMain: 10,
            isMain: false,
            weight: 10 + i,
          },
        });
        return Promise.all([mainUnitPromise, secondaryUnitPromise]);
      }),
    );
    return "injected successfully";
  });
  console.log("Product Units Seeded:", data);
};
