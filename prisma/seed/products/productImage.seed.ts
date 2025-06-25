import { PrismaClient } from "@prisma/client";

export const ProductImagesSeed = async (prisma: PrismaClient) => {
  const startNumber = 31;
  const endNumber = 60;
  const data = await prisma.$transaction(async (tx) => {
    await Promise.all(
      Array.from({ length: endNumber - startNumber + 1 }, (_, idx) => {
        const i = startNumber + idx;
        // First image (thumbnail)
        const createFirstImage = tx.productImage.create({
          data: {
            isThumbnail: true,
            imageUrl:
              "https://res.cloudinary.com/ddaktz2rj/image/upload/v1749760637/download_2_wwmlew.jpg",
            productId: `${i}`,
          },
        });
        // Second image (not thumbnail)
        const createSecondImage = tx.productImage.create({
          data: {
            isThumbnail: false,
            imageUrl:
              "https://res.cloudinary.com/ddaktz2rj/image/upload/v1749760638/download_3_qtw8xi.jpg",
            productId: `${i}`,
          },
        });
        return Promise.all([createFirstImage, createSecondImage]);
      }),
    );
    return " injected successfully";
  });
  console.log("Product Images Seeded:", data);
};
