import { PrismaClient } from "@prisma/client";

export const categoriesSeed = async (prisma: PrismaClient) => {
  const startNumber = 1;
  const endNumber = 30;
  const data = await prisma.$transaction(async (tx) => {
    await Promise.all(
      Array.from({ length: endNumber - startNumber + 1 }, (_, idx) => {
        const i = startNumber + idx;
        return tx.category.create({
          data: {
            id: `${i}`,
            name: `Category ${i}`,
            description: `Description for Category ${i}`,
          },
        });
      }),
    );
    return "Categories injected successfully";
  });
  return {
    message: data,
  };
};
