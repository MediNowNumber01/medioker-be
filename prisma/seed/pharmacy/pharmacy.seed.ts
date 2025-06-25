import { PrismaClient } from "@prisma/client";

export const pharmaciesSeed = async (prisma: PrismaClient) => {
  const startNumber = 1;
  const endNumber = 50;
  const data = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      select: { id: true },
    });
    await Promise.all(
      Array.from({ length: endNumber - startNumber + 1 }, async (_, idx) => {
        const i = startNumber + idx;
        await tx.pharmacy.create({
          data: {
            id: `${i}`,
            name: `Pharmacy ${i}`,
            isOpen: i < 40,
            picture: `https://res.cloudinary.com/ddaktz2rj/image/upload/v1749816236/ct2uztzywmsqusgvsdi7.png`,
            // description: `Description for Pharmacy ${i}`,
            // slug: `pharmacy-${i}`,
            detailLocation: `Detail location for Pharmacy ${i}`,
            lat: (Math.random() * 180 - 90).toString(), // Random latitude between -90 and 90
            lng: (Math.random() * 360 - 180).toString(), // Random longitude between -180 and 180
          },
        });
        await tx.stock.createMany({
          data: products.map((product) => ({
            productId: product.id,
            pharmacyId: `${i}`,
            quantity: Math.floor(Math.random() * 100) + 1, // Random quantity between 1 and 100
          })),
        });
      }),
    );
    return "Pharmacies injected successfully";
  });
  return {
    message: data,
  };
};
