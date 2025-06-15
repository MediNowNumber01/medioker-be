import { PrismaClient } from "@prisma/client";

export const productStocksSeed = async (prisma: PrismaClient) => {
  const startNumber = 1;
  const endNumber = 150;
  const data = await prisma.$transaction(async (tx) => {
    const pharmacies = await tx.pharmacy.findMany({
      select: { id: true },
    });
    await Promise.all(
      Array.from({ length: endNumber - startNumber + 1 }, (_, idx) => {
        const i = startNumber + idx;
        return tx.stock.createMany({
          data: pharmacies.map((pharmacy) => ({
            productId: `${i}`,
            pharmacyId: pharmacy.id,
            quantity: i,
          })),
        });
      }),
    );
    return "injected successfully";
  });
  console.log("Product Stocks Seeded:", data);
};
